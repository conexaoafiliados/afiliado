import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const steps: Record<string, string> = {};

  try {
    steps.env = `db=${Boolean(process.env.DATABASE_URL)} supa=${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`;
    await import("../../server/_core/trpc");
    steps.trpc = "ok";
    await import("../../server/_core/context");
    steps.context = "ok";
    await import("../../server/db");
    steps.db = "ok";
    await import("../../server/routers/auth");
    steps.authRouter = "ok";
    await import("../../server/routers/index");
    steps.appRouter = "ok";
    res.status(200).json({ ok: true, steps });
  } catch (error) {
    res.status(500).json({
      ok: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
