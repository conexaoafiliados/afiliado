import { publicProcedure, router } from "./trpc";
import { APP_NAME } from "../const";

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    app: APP_NAME,
    timestamp: new Date().toISOString(),
  })),
});
