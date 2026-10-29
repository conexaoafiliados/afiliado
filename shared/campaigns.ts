/**
 * Regras compartilhadas de campanhas, candidaturas e entregas.
 * Validações no servidor; a UI não é a fonte de autorização.
 */

import { isHttpUrl, isValidSlug, SLUG_HINT } from "./brands";

export const CAMPAIGN_STATUSES = ["draft", "published", "closed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  published: "Publicada",
  closed: "Encerrada",
};

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Em análise",
  approved: "Aprovada",
  rejected: "Recusada",
};

export const DELIVERY_STATUSES = ["submitted", "changes_requested", "approved"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  submitted: "Enviada",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovada",
};

export const CONTENT_FORMATS = [
  "tiktok",
  "reels",
  "stories",
  "feed",
  "shorts",
  "youtube",
  "outro",
] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  stories: "Stories",
  feed: "Feed",
  shorts: "Shorts",
  youtube: "YouTube",
  outro: "Outro",
};

export { SLUG_HINT, isValidSlug, isHttpUrl };

export function canTransitionCampaignStatus(from: CampaignStatus, to: CampaignStatus): boolean {
  if (from === to) return false;
  if (from === "draft" && (to === "published" || to === "closed")) return true;
  if (from === "published" && (to === "draft" || to === "closed")) return true;
  if (from === "closed" && to === "draft") return true; // reabrir como rascunho para editar
  return false;
}

export function canReviewApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return from === "pending" && (to === "approved" || to === "rejected");
}

export function canReviewDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return from === "submitted" && (to === "approved" || to === "changes_requested");
}

export type CampaignPublishInput = {
  title?: string | null;
  briefing?: string | null;
  brandId?: number | null;
  productIds?: number[];
  applicationOpensAt?: Date | string | null;
  applicationClosesAt?: Date | string | null;
  deliveryDeadline?: Date | string | null;
};

export function getCampaignPublishIssues(input: CampaignPublishInput): string[] {
  const issues: string[] = [];
  if (!input.title?.trim()) issues.push("Informe o título.");
  if (!input.briefing?.trim()) issues.push("Informe o briefing.");
  if (!input.brandId) issues.push("Vincule uma marca.");
  if (!input.productIds?.length) issues.push("Vincule ao menos um produto da marca.");
  if (!input.applicationOpensAt) issues.push("Defina o início das candidaturas.");
  if (!input.applicationClosesAt) issues.push("Defina o fim das candidaturas.");
  if (!input.deliveryDeadline) issues.push("Defina o prazo de entrega.");

  const open = input.applicationOpensAt ? new Date(input.applicationOpensAt) : null;
  const close = input.applicationClosesAt ? new Date(input.applicationClosesAt) : null;
  const delivery = input.deliveryDeadline ? new Date(input.deliveryDeadline) : null;
  if (open && close && !(open < close)) issues.push("O fim das candidaturas deve ser após o início.");
  if (close && delivery && !(close <= delivery)) {
    issues.push("O prazo de entrega deve ser igual ou posterior ao fim das candidaturas.");
  }
  return issues;
}

export type ApplicationWindowInput = {
  status: CampaignStatus;
  applicationOpensAt: Date | string | null;
  applicationClosesAt: Date | string | null;
  now?: Date;
};

/** Candidaturas só em campanhas publicadas e dentro do período. */
export function canApplyToCampaign(input: ApplicationWindowInput): { ok: true } | { ok: false; reason: string } {
  if (input.status !== "published") {
    return { ok: false, reason: "Esta campanha não está aberta para candidaturas." };
  }
  const now = input.now ?? new Date();
  const open = input.applicationOpensAt ? new Date(input.applicationOpensAt) : null;
  const close = input.applicationClosesAt ? new Date(input.applicationClosesAt) : null;
  if (!open || !close) {
    return { ok: false, reason: "Período de candidatura não configurado." };
  }
  if (now < open) return { ok: false, reason: "As candidaturas ainda não começaram." };
  if (now > close) return { ok: false, reason: "O período de candidaturas encerrou." };
  return { ok: true };
}

export function canSubmitDelivery(input: {
  campaignStatus: CampaignStatus;
  applicationStatus: ApplicationStatus;
  latestDeliveryStatus: DeliveryStatus | null;
}): { ok: true } | { ok: false; reason: string } {
  if (input.applicationStatus !== "approved") {
    return { ok: false, reason: "Somente participantes aprovados podem enviar entregas." };
  }
  if (input.campaignStatus === "draft") {
    return { ok: false, reason: "Campanha indisponível." };
  }
  if (input.latestDeliveryStatus === "submitted") {
    return { ok: false, reason: "Aguarde a revisão da entrega já enviada." };
  }
  if (input.latestDeliveryStatus === "approved") {
    return { ok: false, reason: "Sua entrega já foi aprovada." };
  }
  // null (primeira) ou changes_requested → pode enviar
  return { ok: true };
}

export type SampleAddress = {
  fullName: string;
  phone: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

export function validateSampleAddress(address: Partial<SampleAddress> | null | undefined): string[] {
  if (!address) return ["Informe o endereço para envio da amostra."];
  const issues: string[] = [];
  if (!address.fullName?.trim()) issues.push("Nome completo para entrega.");
  if (!address.phone?.trim()) issues.push("Telefone de contato.");
  if (!address.street?.trim()) issues.push("Rua/avenida.");
  if (!address.number?.trim()) issues.push("Número.");
  if (!address.neighborhood?.trim()) issues.push("Bairro.");
  if (!address.city?.trim()) issues.push("Cidade.");
  if (!address.state?.trim()) issues.push("UF.");
  if (!address.zip?.trim()) issues.push("CEP.");
  return issues;
}

/** Remove endereço de payloads públicos. */
export function stripSampleAddress<T extends { sampleAddress?: unknown }>(
  row: T
): Omit<T, "sampleAddress"> {
  const { sampleAddress: _removed, ...rest } = row;
  return rest;
}
