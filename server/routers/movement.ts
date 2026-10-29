import { z } from "zod";
import { INTEREST_KEYS } from "../../shared/brands";
import { computeNextStep, getProfileMissingItems } from "../../shared/nextStep";
import {
  BrandsDbError,
  countPublishedBrands,
  getUserPreferences,
  listPublishedBrands,
  saveUserPreferences,
} from "../brandsDb";
import { getAllMissions, getCreatorProfile, getMissionsByUserId } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { toTrpcError } from "./brands";

const preferencesInput = z.object({
  interests: z
    .array(z.enum(INTEREST_KEYS))
    .max(INTEREST_KEYS.length)
    .transform(list => Array.from(new Set(list))),
  brandIds: z
    .array(z.number().int().positive())
    .max(100)
    .transform(list => Array.from(new Set(list))),
});

export const movementRouter = router({
  /** Interesses e marcas de interesse do próprio usuário. */
  preferences: protectedProcedure.query(async ({ ctx }) => getUserPreferences(ctx.user.id)),

  /**
   * Salva (substitui) interesses e marcas de interesse. Pode ser vazio e pode ser alterado depois.
   * Interesses NÃO concedem permissão administrativa nem aprovação de afiliado/embaixador.
   */
  savePreferences: protectedProcedure.input(preferencesInput).mutation(async ({ ctx, input }) => {
    try {
      return await saveUserPreferences(ctx.user.id, input.interests, input.brandIds);
    } catch (error) {
      if (error instanceof BrandsDbError) return toTrpcError(error);
      throw error;
    }
  }),

  /** Dados reais para "Meu início". Nada aqui é fictício: ausência vira estado vazio na UI. */
  home: protectedProcedure.query(async ({ ctx }) => {
    const [profile, preferences, brands, missions, mine, publishedBrandCount] = await Promise.all([
      getCreatorProfile(ctx.user.id),
      getUserPreferences(ctx.user.id),
      listPublishedBrands(),
      getAllMissions(),
      getMissionsByUserId(ctx.user.id),
      countPublishedBrands(),
    ]);

    const profileFlags = {
      hasAvatar: Boolean(profile?.profileImageUrl),
      hasBio: Boolean(profile?.bio?.trim()),
      hasSocial: Boolean(profile?.instagramHandle || profile?.tiktokHandle),
    };

    const nextStep = computeNextStep({
      profile: profileFlags,
      interestsSaved: preferences.savedAt !== null,
      publishedMissions: missions.length,
      userMissionsStarted: mine.length,
      publishedBrands: publishedBrandCount,
      userBrandInterests: preferences.brandIds.length,
    });

    return {
      nextStep,
      profileMissing: getProfileMissingItems(profileFlags),
      preferences,
      brands: brands.slice(0, 6),
      brandCount: publishedBrandCount,
      missions: { published: missions.length, started: mine.length },
    };
  }),
});
