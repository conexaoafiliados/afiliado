import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getUserByUsername,
  upsertCreatorProfile,
  upsertFollowerProgress,
  upsertUser,
} from "../db";
import { authEmailForUsername, getSupabaseAdmin } from "../_core/supabaseAdmin";
import { publicProcedure, router } from "../_core/trpc";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Usuário deve ter pelo menos 3 caracteres")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e _"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Informe seu nome"),
  cep: z.string().min(8, "CEP inválido"),
  street: z.string().min(1, "Informe o endereço"),
  number: z.string().optional(),
  neighborhood: z.string().min(1, "Informe o bairro"),
  city: z.string().min(1, "Informe a cidade"),
  state: z
    .string()
    .optional()
    .transform(s => (s && s.trim().length === 2 ? s.trim().toUpperCase() : undefined)),
  age: z.number().int().min(13, "Idade mínima: 13").max(120),
  tiktokHandle: z.string().min(1, "Informe seu @ do TikTok"),
  instagramHandle: z.string().min(1, "Informe seu @ do Instagram"),
  currentFollowers: z.number().int().min(0),
  platformObjective: z.string().min(10, "Descreva seu objetivo (mín. 10 caracteres)"),
  profileImageBase64: z.string().optional(),
  profileImageMime: z.string().optional(),
});

async function uploadAvatar(userId: string, base64: string, mime?: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const ext = mime?.includes("png") ? "png" : "jpg";
  const path = `${userId}.${ext}`;
  const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  const { error } = await admin.storage.from("avatars").upload(path, buffer, {
    contentType: mime || "image/jpeg",
    upsert: true,
  });
  if (error) {
    console.warn("[Avatar upload]", error.message);
    return null;
  }
  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie?.("cc_session");
    return { success: true } as const;
  }),

  register: publicProcedure.input(registerSchema).mutation(async ({ input }) => {
    try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada",
      });
    }

    const existing = await getUserByUsername(input.username);
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "Este usuário já existe" });
    }

    const email = authEmailForUsername(input.username);
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        username: input.username.toLowerCase(),
        name: input.name,
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? "Não foi possível criar a conta";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        throw new TRPCError({ code: "CONFLICT", message: "Este usuário já existe" });
      }
      throw new TRPCError({ code: "BAD_REQUEST", message: msg });
    }

    const openId = authData.user.id;
    let profileImageUrl: string | null = null;
    if (input.profileImageBase64) {
      profileImageUrl = await uploadAvatar(openId, input.profileImageBase64, input.profileImageMime);
    }

    try {
      await upsertUser({
        openId,
        username: input.username.toLowerCase(),
        name: input.name,
        email,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });
    } catch (e) {
      console.warn("[Register] upsertUser failed — check DATABASE_URL e migration_auth_fields.sql:", e);
    }

    const dbUser = await getUserByUsername(input.username);
    if (dbUser) {
      try {
        await upsertCreatorProfile(dbUser.id, {
          profileImageUrl: profileImageUrl ?? undefined,
          cep: input.cep.replace(/\D/g, ""),
          street: input.street,
          number: input.number,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          age: input.age,
          tiktokHandle: input.tiktokHandle.replace(/^@/, ""),
          instagramHandle: input.instagramHandle.replace(/^@/, ""),
          platformObjective: input.platformObjective,
        });

        const target = 2000;
        const pct = Math.min(100, (input.currentFollowers / target) * 100);
        await upsertFollowerProgress(dbUser.id, {
          currentFollowers: input.currentFollowers,
          targetFollowers: target,
          progressPercentage: pct.toFixed(2),
        });
      } catch (e) {
        console.warn("[Register] Profile save failed — check DATABASE_URL:", e);
      }
    } else {
      console.warn("[Register] User not in DB — check DATABASE_URL and migration_auth_fields.sql");
    }

    const { data: signIn, error: signInError } = await admin.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (signInError || !signIn.session) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Conta criada, mas falha ao iniciar sessão. Faça login.",
      });
    }

    return {
      accessToken: signIn.session.access_token,
      refreshToken: signIn.session.refresh_token,
      expiresIn: signIn.session.expires_in,
    };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Register]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao criar conta",
      });
    }
  }),

  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(3),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
      const admin = getSupabaseAdmin();
      if (!admin) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada",
        });
      }

      const dbUser = await getUserByUsername(input.username);
      const email = dbUser?.email ?? authEmailForUsername(input.username);

      const { data, error } = await admin.auth.signInWithPassword({
        email,
        password: input.password,
      });

      if (error || !data.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou senha incorretos",
        });
      }

      try {
        await upsertUser({
          openId: data.user.id,
          username: input.username.toLowerCase(),
          name: data.user.user_metadata?.name ?? dbUser?.name,
          email,
          loginMethod: "password",
          lastSignedIn: new Date(),
        });
      } catch (e) {
        console.warn("[Login] upsertUser failed:", e);
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Login]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao entrar. Tente novamente.",
        });
      }
    }),
});
