import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  getBrandPublishIssues,
  getProductPublishIssues,
  isHttpUrl,
  isValidSlug,
  readableTextColor,
  slugify,
} from "./brands";
import { computeNextStep } from "./nextStep";

describe("slug", () => {
  it("gera slug sem acentos e com hífens", () => {
    expect(slugify("Xiclé Body Splash 150 ml")).toBe("xicle-body-splash-150-ml");
    expect(slugify("  Lizin!!  ")).toBe("lizin");
  });

  it("valida formato e palavras reservadas", () => {
    expect(isValidSlug("lizin")).toBe(true);
    expect(isValidSlug("body-splash-150ml")).toBe(true);
    expect(isValidSlug("Lizin")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("-lizin")).toBe(false);
    expect(isValidSlug("li zin")).toBe(false);
    expect(isValidSlug("novo")).toBe(false);
  });
});

describe("isHttpUrl", () => {
  it("aceita apenas http(s)", () => {
    expect(isHttpUrl("https://exemplo.com/p")).toBe(true);
    expect(isHttpUrl("http://exemplo.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html;base64,AAAA")).toBe(false);
    expect(isHttpUrl("não é url")).toBe(false);
  });
});

describe("publicação", () => {
  it("exige nome, slug válido e descrição para publicar marca", () => {
    expect(getBrandPublishIssues({ name: "Lizin", slug: "lizin", description: null })).toHaveLength(1);
    expect(getBrandPublishIssues({ name: "", slug: "x", description: "" })).toHaveLength(3);
    expect(getBrandPublishIssues({ name: "Lizin", slug: "lizin", description: "Marca capilar" })).toEqual([]);
  });

  it("exige descrição para publicar produto", () => {
    expect(getProductPublishIssues({ name: "Produto", slug: "produto", description: " " })).toHaveLength(1);
    expect(getProductPublishIssues({ name: "Produto", slug: "produto", description: "ok" })).toEqual([]);
  });

  it("restringe transições de status: arquivado só volta para rascunho", () => {
    expect(canTransitionStatus("draft", "published")).toBe(true);
    expect(canTransitionStatus("published", "archived")).toBe(true);
    expect(canTransitionStatus("archived", "published")).toBe(false);
    expect(canTransitionStatus("archived", "draft")).toBe(true);
    expect(canTransitionStatus("draft", "draft")).toBe(false);
  });
});

describe("readableTextColor", () => {
  it("escolhe texto escuro em cores claras e claro em cores escuras", () => {
    expect(readableTextColor("#ffff00")).toBe("#111827");
    expect(readableTextColor("#1f2937")).toBe("#ffffff");
    expect(readableTextColor(null)).toBe("#ffffff");
  });
});

describe("computeNextStep", () => {
  const complete = { hasAvatar: true, hasBio: true, hasSocial: true };
  const base = {
    profile: complete,
    interestsSaved: true,
    publishedMissions: 0,
    userMissionsStarted: 0,
    publishedBrands: 0,
    userBrandInterests: 0,
  };

  it("prioriza completar o perfil", () => {
    const step = computeNextStep({ ...base, profile: { ...complete, hasBio: false } });
    expect(step?.kind).toBe("complete_profile");
    expect(step?.description).toContain("bio");
  });

  it("sugere escolher interesses somente se nunca salvou", () => {
    expect(computeNextStep({ ...base, interestsSaved: false })?.kind).toBe("choose_interests");
  });

  it("só sugere missão se existir missão publicada e nenhuma iniciada", () => {
    expect(computeNextStep({ ...base, publishedMissions: 2 })?.kind).toBe("start_mission");
    expect(computeNextStep({ ...base, publishedMissions: 2, userMissionsStarted: 1 })?.kind).not.toBe("start_mission");
    expect(computeNextStep(base)?.kind).not.toBe("start_mission");
  });

  it("só sugere marcas se houver marcas publicadas", () => {
    expect(computeNextStep({ ...base, publishedBrands: 2 })?.kind).toBe("discover_brands");
    expect(computeNextStep({ ...base, publishedBrands: 0 })?.kind).toBe("start_learning");
    expect(computeNextStep({ ...base, publishedBrands: 2, userBrandInterests: 1 })?.kind).toBe("start_learning");
  });
});
