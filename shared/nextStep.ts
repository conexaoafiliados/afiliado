/**
 * Decide o "próximo passo real" do creator a partir de dados existentes.
 * Função pura: não inventa atividade — se nada se aplica, retorna null e a UI mostra estado vazio.
 *
 * Etapas seguintes (campanhas, candidaturas, entregas) acrescentam novos `kind` aqui.
 */

export type NextStepKind =
  | "complete_profile"
  | "choose_interests"
  | "start_mission"
  | "discover_brands"
  | "start_learning";

export type NextStep = {
  kind: NextStepKind;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type NextStepInput = {
  profile: {
    hasAvatar: boolean;
    hasBio: boolean;
    hasSocial: boolean;
  };
  interestsSaved: boolean;
  /** Missões publicadas (isActive) e quantas o usuário já aceitou/iniciou. */
  publishedMissions: number;
  userMissionsStarted: number;
  /** Marcas publicadas e quantas o usuário marcou como interesse. */
  publishedBrands: number;
  userBrandInterests: number;
};

export function getProfileMissingItems(profile: NextStepInput["profile"]): string[] {
  const missing: string[] = [];
  if (!profile.hasAvatar) missing.push("foto de perfil");
  if (!profile.hasBio) missing.push("bio");
  if (!profile.hasSocial) missing.push("redes sociais");
  return missing;
}

export function computeNextStep(input: NextStepInput): NextStep | null {
  const missing = getProfileMissingItems(input.profile);
  if (missing.length > 0) {
    return {
      kind: "complete_profile",
      title: "Complete seu perfil",
      description: `Faltam: ${missing.join(", ")}. Um perfil completo ajuda a equipe e a comunidade a conhecer você.`,
      href: "/profile/edit",
      cta: "Completar perfil",
    };
  }

  if (!input.interestsSaved) {
    return {
      kind: "choose_interests",
      title: "Conte o que você quer fazer aqui",
      description: "Aprender, criar conteúdo, indicar ou vender. Você pode escolher mais de um e mudar quando quiser.",
      href: "/dashboard#interesses",
      cta: "Escolher interesses",
    };
  }

  if (input.publishedMissions > 0 && input.userMissionsStarted === 0) {
    return {
      kind: "start_mission",
      title: "Participe de uma missão",
      description: "Há missões publicadas esperando por você.",
      href: "/growth/missions",
      cta: "Ver missões",
    };
  }

  if (input.publishedBrands > 0 && input.userBrandInterests === 0) {
    return {
      kind: "discover_brands",
      title: "Conheça as marcas do movimento",
      description: "Veja as marcas participantes, seus produtos e o que cada uma propõe.",
      href: "/marcas",
      cta: "Explorar marcas",
    };
  }

  return {
    kind: "start_learning",
    title: "Continue aprendendo",
    description: "As trilhas de aprendizado estão disponíveis a qualquer momento.",
    href: "/aprender",
    cta: "Ir para Aprender",
  };
}
