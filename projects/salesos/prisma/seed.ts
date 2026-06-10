/**
 * SalesOS initial seed.
 *
 * Generates a realistic, story-telling dataset:
 *  - 1 admin, 1 manager, 5 reps (the 3 demo logins are among them)
 *  - 80 contacts across ~32 companies (Indo/Western name mix)
 *  - 194 deals across every stage, with varied stageEnteredAt (some purposely
 *    stale so the aging heatmap lights up) and closedAt on closed deals
 *  - 3–8 activities per deal
 *  - 12 monthly snapshots (actual vs forecast, new vs expansion)
 *
 * Uses a seeded PRNG so the dataset is reproducible across runs.
 * Run via `npm run db:seed` (prisma db seed) or `tsx prisma/seed.ts`.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { subDays, subMonths, addDays, startOfMonth } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";
import { DEMO_PASSWORD } from "../lib/demo";

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) — deterministic output run-to-run.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240601);

const rand = () => rng();
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
function weighted<T>(entries: readonly [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of entries) {
    if ((r -= w) <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
const maxDate = (a: Date, b: Date) => (a > b ? a : b);
const minDate = (a: Date, b: Date) => (a < b ? a : b);

const now = new Date();

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------
const FIRST_NAMES = [
  "Rizki", "Siti", "Adi", "Putri", "Dewi", "Agus", "Eka", "Bayu", "Indah",
  "Fitri", "Ahmad", "Citra", "Dimas", "Ratna", "Yusuf", "Made", "Wayan",
  "James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Sophia", "Henry", "Mia",
  "Lucas", "Isabella", "Mason", "Charlotte", "Ethan", "Amelia", "Daniel",
  "Grace", "Owen", "Chloe", "Nadia", "Reza",
] as const;

const LAST_NAMES = [
  "Wijaya", "Santoso", "Pratama", "Nugroho", "Halim", "Putra", "Susanto",
  "Hartono", "Gunawan", "Kusuma", "Saputra", "Lestari", "Permana", "Wibowo",
  "Setiawan", "Smith", "Johnson", "Williams", "Brown", "Garcia", "Miller",
  "Davis", "Anderson", "Taylor", "Moore", "Martin", "Lee", "Clark", "Carter",
] as const;

const COMPANIES = [
  "Nusantara Logistics", "Garuda Fintech", "Meridian Health", "Apex Manufacturing",
  "Borneo Agritech", "Vertex Cloud", "Sentosa Retail Group", "Pacific Freight",
  "Lumen Analytics", "Jakarta Digital", "Northwind Software", "Cendana Capital",
  "Bluepeak Industries", "Sumatra Foods", "Orion Robotics", "Kirana Media",
  "Summit Insurance", "Delta Energy", "Bahari Maritime", "Quantum Payments",
  "Anugrah Pharma", "Cascade Telecom", "Mandala Construction", "Helix Biotech",
  "Pelita Education", "Ironwood Securities", "Saffron Hospitality", "Tropika Beverages",
  "Granite Mining", "Aster Aerospace", "Cendrawasih Travel", "Beacon Logistics",
] as const;

const TITLES = [
  "VP Sales", "Head of Procurement", "CTO", "Operations Director",
  "Finance Manager", "Founder & CEO", "Product Lead", "IT Manager",
  "Marketing Director", "Procurement Lead", "COO", "Head of Growth",
  "Director of Engineering", "Purchasing Manager",
] as const;

const PRODUCT_LINES = [
  "Platform License", "Annual Subscription", "Enterprise Rollout", "Pilot Program",
  "Expansion Seats", "Premium Support", "Onboarding Package", "Data Migration",
  "API Integration", "Custom Module", "Analytics Add-on", "Security Tier",
] as const;

const LOST_REASONS = [
  "Lost to competitor", "Budget cut", "No decision / stalled", "Bad timing",
  "Missing feature", "Champion left", "Went with in-house build",
] as const;

const ACTIVITY_NOTES: Record<string, readonly string[]> = {
  CALL: [
    "Discovery call — mapped out current workflow and pain points.",
    "Quick sync to discuss timeline and stakeholders.",
    "Follow-up call; they want to involve their finance team.",
    "Left a voicemail, sent a recap email.",
  ],
  EMAIL: [
    "Sent over the proposal and pricing breakdown.",
    "Shared case study from a similar client.",
    "Followed up on outstanding questions.",
    "Emailed updated SOW after the last call.",
  ],
  MEETING: [
    "Demo with the wider team — strong interest in reporting.",
    "On-site meeting to align on rollout plan.",
    "Procurement review meeting; ironing out contract terms.",
    "Stakeholder workshop to scope requirements.",
  ],
  NOTE: [
    "Champion is enthusiastic but budget approval is the blocker.",
    "Competitor is also in the mix — need to differentiate on support.",
    "Decision expected after their next board meeting.",
    "Re-engaged after going quiet for two weeks.",
  ],
  STAGE_CHANGE: [
    "Advanced to the next stage after positive feedback.",
    "Moved forward — budget confirmed.",
    "Progressed following successful demo.",
    "Stage updated after procurement sign-off.",
  ],
};

const DEAL_NOTES = [
  "Multi-year potential if the pilot lands.",
  "Price-sensitive; emphasise ROI.",
  "Needs SSO and audit logs before signing.",
  "Warm intro from an existing customer.",
  "Renewal-adjacent — expansion opportunity.",
  "Procurement cycle is slow here, plan accordingly.",
] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------------------------------------------------------------------------
// Stage configuration
// ---------------------------------------------------------------------------
type Stage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

const STAGE_PLAN: { stage: Stage; count: number }[] = [
  { stage: "LEAD", count: 60 },
  { stage: "QUALIFIED", count: 38 },
  { stage: "PROPOSAL", count: 24 },
  { stage: "NEGOTIATION", count: 16 },
  { stage: "CLOSED_WON", count: 38 },
  { stage: "CLOSED_LOST", count: 18 },
];

const PROBABILITY: Record<Stage, () => number> = {
  LEAD: () => randInt(5, 25),
  QUALIFIED: () => randInt(30, 50),
  PROPOSAL: () => randInt(50, 70),
  NEGOTIATION: () => randInt(70, 90),
  CLOSED_WON: () => 100,
  CLOSED_LOST: () => 0,
};

function dealValue(): number {
  // Skew toward mid-market (~$18k average), range $1.5k–$85k.
  const base = 1500 + Math.pow(rand(), 1.9) * (85000 - 1500);
  return Math.round(base / 500) * 500;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------
async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Users: 3 demo accounts + 4 extra reps.
  const userSeeds = [
    { email: "admin@salesos.dev", name: "Sari Wijaya", role: "ADMIN" as const },
    { email: "manager@salesos.dev", name: "Daniel Carter", role: "MANAGER" as const },
    { email: "rep@salesos.dev", name: "Rizki Pratama", role: "REP" as const },
    { email: "ava.miller@salesos.dev", name: "Ava Miller", role: "REP" as const },
    { email: "dimas.santoso@salesos.dev", name: "Dimas Santoso", role: "REP" as const },
    { email: "grace.lee@salesos.dev", name: "Grace Lee", role: "REP" as const },
    { email: "bayu.nugroho@salesos.dev", name: "Bayu Nugroho", role: "REP" as const },
  ];

  const users = userSeeds.map((u) => ({
    id: randomUUID(),
    email: u.email,
    passwordHash,
    name: u.name,
    role: u.role,
    avatarInitials: initials(u.name),
    active: true,
    createdAt: subDays(now, randInt(120, 400)),
  }));

  const repIds = users.filter((u) => u.role === "REP").map((u) => u.id);
  const managerId = users.find((u) => u.role === "MANAGER")!.id;
  const demoRepId = users.find((u) => u.email === "rep@salesos.dev")!.id;

  // Weight deal assignment so the demo rep has a healthy, visible pipeline.
  const repWeights: [string, number][] = repIds.map((id) => [
    id,
    id === demoRepId ? 2.4 : 1,
  ]);

  // Contacts: 80 across the companies (some companies get multiple contacts).
  const contacts = Array.from({ length: 80 }, () => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const company = pick(COMPANIES);
    const handle = name.toLowerCase().replace(/\s+/g, ".");
    const domain = company.toLowerCase().replace(/[^a-z]+/g, "");
    return {
      id: randomUUID(),
      name,
      email: chance(0.92) ? `${handle}@${domain}.com` : null,
      phone: chance(0.6)
        ? `+62 ${randInt(811, 899)}-${randInt(1000, 9999)}-${randInt(1000, 9999)}`
        : null,
      company,
      title: chance(0.85) ? pick(TITLES) : null,
      notes: chance(0.25) ? pick(DEAL_NOTES) : null,
      createdAt: subDays(now, randInt(10, 400)),
    };
  });

  // Deals.
  type DealRow = {
    id: string;
    title: string;
    value: number;
    stage: Stage;
    probability: number;
    expectedCloseDate: Date;
    stageEnteredAt: Date;
    closedAt: Date | null;
    dealType: "NEW" | "EXPANSION";
    createdAt: Date;
    updatedAt: Date;
    contactId: string;
    assignedTo: string;
    notes: string | null;
    lostReason: string | null;
  };

  const deals: DealRow[] = [];

  for (const { stage, count } of STAGE_PLAN) {
    const closed = stage === "CLOSED_WON" || stage === "CLOSED_LOST";
    for (let i = 0; i < count; i++) {
      const contact = pick(contacts);
      const assignedTo = weighted(repWeights);
      const value = dealValue();
      const dealType: "NEW" | "EXPANSION" = chance(0.3) ? "EXPANSION" : "NEW";

      let createdAt: Date;
      let stageEnteredAt: Date;
      let closedAt: Date | null = null;
      let expectedCloseDate: Date;

      if (closed) {
        // Closed somewhere in the last 12 months, weighted toward recent.
        const closedDaysAgo = Math.floor(Math.pow(rand(), 1.5) * 360) + 3;
        closedAt = subDays(now, closedDaysAgo);
        const cycleDays = randInt(14, 120);
        createdAt = subDays(closedAt, cycleDays);
        stageEnteredAt = closedAt; // entered the CLOSED stage at close time
        expectedCloseDate = addDays(closedAt, randInt(-7, 7));
      } else {
        createdAt = subDays(now, randInt(1, 160));
        // ~30% are deliberately stale so the aging heatmap shows 15–30d / 30d+ cells.
        const stale = chance(0.3);
        const enteredDaysAgo = stale ? randInt(16, 80) : randInt(0, 14);
        stageEnteredAt = maxDate(subDays(now, enteredDaysAgo), createdAt);
        expectedCloseDate = addDays(now, randInt(5, 90));
      }

      const updatedAt = closed ? closedAt! : maxDate(stageEnteredAt, createdAt);

      deals.push({
        id: randomUUID(),
        title: `${contact.company} — ${pick(PRODUCT_LINES)}`,
        value,
        stage,
        probability: PROBABILITY[stage](),
        expectedCloseDate,
        stageEnteredAt,
        closedAt,
        dealType,
        createdAt,
        updatedAt,
        contactId: contact.id,
        assignedTo,
        notes: chance(0.45) ? pick(DEAL_NOTES) : null,
        lostReason: stage === "CLOSED_LOST" ? pick(LOST_REASONS) : null,
      });
    }
  }

  // Activities: 3–8 per deal.
  type ActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE" | "STAGE_CHANGE";
  type ActivityRow = {
    id: string;
    type: ActivityType;
    note: string | null;
    createdAt: Date;
    dealId: string;
    userId: string;
  };
  const activities: ActivityRow[] = [];

  for (const deal of deals) {
    const n = randInt(3, 8);
    const end = deal.closedAt ?? now;
    for (let i = 0; i < n; i++) {
      const type = weighted<ActivityType>([
        ["EMAIL", 0.34],
        ["CALL", 0.24],
        ["MEETING", 0.16],
        ["NOTE", 0.16],
        ["STAGE_CHANGE", 0.1],
      ]);
      // Spread activities between deal creation and its close/now.
      const span = Math.max(1, (end.getTime() - deal.createdAt.getTime()));
      const at = new Date(deal.createdAt.getTime() + rand() * span);
      activities.push({
        id: randomUUID(),
        type,
        note: pick(ACTIVITY_NOTES[type]),
        createdAt: minDate(at, now),
        dealId: deal.id,
        userId: chance(0.85) ? deal.assignedTo : managerId,
      });
    }
  }

  // Monthly snapshots: 12 months back, upward trend + noise.
  type SnapshotRow = {
    id: string;
    month: number;
    year: number;
    revenue: number;
    forecastedRevenue: number;
    newBusiness: number;
    expansion: number;
    newDeals: number;
    wonDeals: number;
    lostDeals: number;
    createdAt: Date;
  };
  const snapshots: SnapshotRow[] = [];
  const baseStart = 180000;
  const baseEnd = 345000;

  for (let i = 0; i < 12; i++) {
    const monthDate = startOfMonth(subMonths(now, 11 - i));
    const trend = baseStart + (i / 11) * (baseEnd - baseStart);
    const noise = trend * (rand() * 0.24 - 0.12);
    let revenue = Math.round(trend + noise);
    const isCurrent = i === 11;
    if (isCurrent) revenue = Math.round(revenue * 0.55); // month in progress

    const expansion = Math.round(revenue * (0.18 + rand() * 0.14));
    const newBusiness = revenue - expansion;
    const forecastedRevenue = Math.round(
      (isCurrent ? revenue / 0.55 : revenue) * (0.92 + rand() * 0.18),
    );

    snapshots.push({
      id: randomUUID(),
      month: monthDate.getMonth() + 1,
      year: monthDate.getFullYear(),
      revenue,
      forecastedRevenue,
      newBusiness,
      expansion,
      newDeals: randInt(10, 22),
      wonDeals: randInt(6, 15),
      lostDeals: randInt(3, 9),
      createdAt: monthDate,
    });
  }

  // -------------------------------------------------------------------------
  // Write — wipe in FK-safe order, then bulk insert.
  // -------------------------------------------------------------------------
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Clearing existing data…");
    await prisma.activity.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();
    await prisma.monthlySnapshot.deleteMany();

    console.log(`Seeding ${users.length} users…`);
    await prisma.user.createMany({ data: users });

    console.log(`Seeding ${contacts.length} contacts…`);
    await prisma.contact.createMany({ data: contacts });

    console.log(`Seeding ${deals.length} deals…`);
    await prisma.deal.createMany({ data: deals });

    console.log(`Seeding ${activities.length} activities…`);
    await prisma.activity.createMany({ data: activities });

    console.log(`Seeding ${snapshots.length} monthly snapshots…`);
    await prisma.monthlySnapshot.createMany({ data: snapshots });

    console.log("\n✅ Seed complete.");
    console.log(
      `   ${users.length} users · ${contacts.length} contacts · ${deals.length} deals · ${activities.length} activities · ${snapshots.length} snapshots`,
    );
    console.log("\n   Demo logins (password: salesos2024):");
    console.log("   • admin@salesos.dev   (Admin)");
    console.log("   • manager@salesos.dev (Manager)");
    console.log("   • rep@salesos.dev     (Rep)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
