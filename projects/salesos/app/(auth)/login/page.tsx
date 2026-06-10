"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS } from "@/lib/demo";

export default function LoginPage() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(nextEmail: string, nextPassword: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    passwordRef.current?.focus();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% -10%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(40rem 30rem at 50% 30%, black, transparent 75%)",
        }}
      />

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-xl font-semibold tracking-tight">SalesOS</span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            Your pipeline, your reps, your revenue — all in one place.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border-border rounded-xl border p-6 shadow-2xl shadow-black/40">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back. Enter your credentials to continue.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) submit(email, password);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                ref={passwordRef}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-danger bg-danger/10 border-danger/20 rounded-md border px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-10 w-full"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Demo credentials
            </span>
            <div className="bg-border h-px flex-1" />
          </div>
          <p className="text-muted-foreground mb-3 text-center text-xs">
            Click an account to autofill — password is{" "}
            <span className="font-numeric">salesos2024</span>.
          </p>
          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email, acc.password)}
                disabled={loading}
                className="group border-border bg-card hover:border-primary/50 hover:bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{acc.label}</span>
                    <span className="font-numeric text-muted-foreground truncate text-xs">
                      {acc.email}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {acc.blurb}
                  </div>
                </div>
                <span className="text-primary text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  Autofill →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Logo() {
  return (
    <span className="bg-primary text-primary-foreground inline-flex size-8 items-center justify-center rounded-lg shadow-lg shadow-[var(--primary)]/30">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="translate-y-px"
      >
        <path
          d="M4 20V10M10 20V4M16 20v-7M22 20H2"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
