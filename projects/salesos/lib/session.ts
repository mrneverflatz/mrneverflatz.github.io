// Pure JWT logic (jose only). No `server-only`, no next/headers — safe to import
// from Route Handlers, the Node-runtime proxy, and standalone scripts (tsx seed).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "salesos_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export type Role = "ADMIN" | "MANAGER" | "REP";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarInitials: string | null;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Sign a session JWT (HS256, 7-day expiry). */
export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    avatarInitials: user.avatarInitials,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verify a session JWT and return the user, or null if invalid/expired/missing. */
export async function verifySession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      avatarInitials: (payload.avatarInitials as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
