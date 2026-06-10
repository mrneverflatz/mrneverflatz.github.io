import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 + the `prisma-client` generator uses the queryCompiler runtime,
// which requires a driver adapter. PrismaPg speaks the Postgres wire protocol
// and works against Neon's pooled connection string over TCP (no websocket setup).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client across HMR reloads in dev to avoid exhausting connections.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
