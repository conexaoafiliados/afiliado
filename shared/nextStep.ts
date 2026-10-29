/**
 * Decide o "próximo passo real" do creator a partir de dados existentes.
 * Função pura: não inventa atividade — se nada se aplica, retorna null e a UI mostra estado vazio.
 */

export type NextStepKind =
  | "complete_profile"
  | "choose_interests"
  | "submit_campaign_delivery"
  | "follow_campaign_application"
  | "open_campaign"
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
  /** Campanhas publicadas aceitando candidatura agora. */
  openCampaigns: number;
  /** Candidaturas do usuário ainda em análise. */
  pendingCampaignApplications: number;
  /** Aprovações que ainda precisam de entrega (ou reenvio). */
  campaignDeliveriesNeeded: number;
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

  if (input.campaignDeliveriesNeeded > 0) {
    return {
      kind: "submit_campaign_delivery",
      title: "Envie ou ajuste sua entrega",
      description: "Há campanha aprovada esperando o link do conteúdo ou um reenvio após pedido de ajuste.",
      href: "/campanhas",
      cta: "Ver minhas campanhas",
    };
  }

  if (input.pendingCampaignApplications > 0) {
    return {
      kind: "follow_campaign_application",
      title: "Acompanhe sua candidatura",
      description: "Sua candidatura está em análise. Você será avisado quando houver resposta.",
      href: "/campanhas",
      cta: "Ver candidaturas",
    };
  }

  if (input.openCampaigns > 0) {
    return {
      kind: "open_campaign",
      title: "Conheça uma campanha aberta",
      description: "Há campanhas publicadas com critérios, prazos e condições para você avaliar antes de se candidatar.",
      href: "/campanhas",
      cta: "Ver campanhas",
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
