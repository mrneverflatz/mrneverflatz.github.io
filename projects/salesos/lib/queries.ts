import "server-only";
import { isSameMonth, isBefore } from "date-fns";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import {
  OPEN_STAGES,
  PIPELINE_STAGES,
  weightedValue,
  type DealStage,
} from "@/lib/deal-meta";

// Reps only see their own book of business; managers and admins see everything.
type DealScope = { assignedTo?: string };

export function dealScope(user: SessionUser): DealScope {
  return user.role === "REP" ? { assignedTo: user.id } : {};
}

const isOpen = (stage: DealStage) => OPEN_STAGES.includes(stage);

// ---------------------------------------------------------------- Dashboard

export async function getDashboardData(user: SessionUser) {
  const scope = dealScope(user);
  const now = new Date();

  const [deals, recentActivities] = await Promise.all([
    prisma.deal.findMany({
      where: scope,
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        stageEnteredAt: true,
        closedAt: true,
        dealType: true,
        contact: { select: { name: true, company: true } },
        rep: { select: { name: true, avatarInitials: true } },
      },
    }),
    prisma.activity.findMany({
      where: { deal: scope },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        note: true,
        createdAt: true,
        user: { select: { name: true } },
        deal: { select: { title: true } },
      },
    }),
  ]);

  const openDeals = deals.filter((d) => isOpen(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
  const lostDeals = deals.filter((d) => d.stage === "CLOSED_LOST");

  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedForecast = openDeals.reduce(
    (sum, d) => sum + weightedValue(d.value, d.probability),
    0,
  );

  const wonThisMonth = wonDeals.filter(
    (d) => d.closedAt && isSameMonth(d.closedAt, now),
  );
  const wonThisMonthValue = wonThisMonth.reduce((sum, d) => sum + d.value, 0);

  const decided = wonDeals.length + lostDeals.length;
  const winRate = decided === 0 ? 0 : wonDeals.length / decided;

  // Per-stage breakdown for the open pipeline.
  const stageBreakdown = PIPELINE_STAGES.map((stage) => {
    const inStage = openDeals.filter((d) => d.stage === stage);
    return {
      stage,
      count: inStage.length,
      value: inStage.reduce((sum, d) => sum + d.value, 0),
    };
  });

  // Deals "needing attention": open, oldest time-in-stage first (stalling),
  // plus a flag for those already past their expected close date.
  const attention = [...openDeals]
    .sort((a, b) => a.stageEnteredAt.getTime() - b.stageEnteredAt.getTime())
    .slice(0, 6)
    .map((d) => ({
      ...d,
      overdue: isBefore(d.expectedCloseDate, now),
    }));

  return {
    kpis: {
      pipelineValue,
      weightedForecast,
      wonThisMonthValue,
      wonThisMonthCount: wonThisMonth.length,
      winRate,
      openCount: openDeals.length,
    },
    stageBreakdown,
    attention,
    recentActivities,
  };
}

// ----------------------------------------------------------------- Pipeline

export async function getPipelineData(user: SessionUser) {
  const scope = dealScope(user);
  const deals = await prisma.deal.findMany({
    where: { ...scope, stage: { in: PIPELINE_STAGES } },
    orderBy: { value: "desc" },
    select: {
      id: true,
      title: true,
      value: true,
      stage: true,
      probability: true,
      expectedCloseDate: true,
      stageEnteredAt: true,
      dealType: true,
      contact: { select: { name: true, company: true } },
      rep: { select: { name: true, avatarInitials: true } },
    },
  });

  const columns = PIPELINE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      deals: stageDeals,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  return {
    columns,
    totalValue: deals.reduce((sum, d) => sum + d.value, 0),
    totalCount: deals.length,
  };
}

// ----------------------------------------------------------------- Contacts

export async function getContactsData(user: SessionUser) {
  const isRep = user.role === "REP";
  const dealFilter = isRep ? { assignedTo: user.id } : {};

  const contacts = await prisma.contact.findMany({
    where: isRep ? { deals: { some: { assignedTo: user.id } } } : {},
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      title: true,
      deals: { where: dealFilter, select: { value: true, stage: true } },
    },
  });

  return contacts.map((c) => {
    const open = c.deals.filter((d) => isOpen(d.stage));
    const won = c.deals.filter((d) => d.stage === "CLOSED_WON");
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      title: c.title,
      dealCount: c.deals.length,
      openValue: open.reduce((sum, d) => sum + d.value, 0),
      wonValue: won.reduce((sum, d) => sum + d.value, 0),
    };
  });
}

// ------------------------------------------------------------------ Reports

export async function getReportsData() {
  const snapshots = await prisma.monthlySnapshot.findMany({
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  const totals = snapshots.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      newBusiness: acc.newBusiness + s.newBusiness,
      expansion: acc.expansion + s.expansion,
      wonDeals: acc.wonDeals + s.wonDeals,
      lostDeals: acc.lostDeals + s.lostDeals,
    }),
    { revenue: 0, newBusiness: 0, expansion: 0, wonDeals: 0, lostDeals: 0 },
  );

  const decided = totals.wonDeals + totals.lostDeals;
  const winRate = decided === 0 ? 0 : totals.wonDeals / decided;

  return { snapshots, totals: { ...totals, winRate } };
}

// --------------------------------------------------------------------- Team

export async function getTeamData() {
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarInitials: true,
      active: true,
      deals: { select: { value: true, stage: true } },
    },
  });

  return users.map((u) => {
    const open = u.deals.filter((d) => isOpen(d.stage));
    const won = u.deals.filter((d) => d.stage === "CLOSED_WON");
    const lost = u.deals.filter((d) => d.stage === "CLOSED_LOST");
    const decided = won.length + lost.length;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarInitials: u.avatarInitials,
      active: u.active,
      openCount: open.length,
      pipelineValue: open.reduce((sum, d) => sum + d.value, 0),
      wonValue: won.reduce((sum, d) => sum + d.value, 0),
      winRate: decided === 0 ? 0 : won.length / decided,
    };
  });
}
