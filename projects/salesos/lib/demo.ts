// Hardcoded demo credentials — shown on the login page and created by the seed.
// Safe to import from client components (no secrets beyond the shared demo password).

export const DEMO_PASSWORD = "salesos2024";

export type DemoAccount = {
  label: string;
  email: string;
  password: string;
  blurb: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Admin",
    email: "admin@salesos.dev",
    password: DEMO_PASSWORD,
    blurb: "Full access — team & settings",
  },
  {
    label: "Manager",
    email: "manager@salesos.dev",
    password: DEMO_PASSWORD,
    blurb: "Pipeline, reports & team",
  },
  {
    label: "Rep",
    email: "rep@salesos.dev",
    password: DEMO_PASSWORD,
    blurb: "Own pipeline & contacts",
  },
];
