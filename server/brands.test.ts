import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./brandsDb", async importOriginal => {
  const actual = await importOriginal<typeof import("./brandsDb")>();
  return {
    ...actual,
    listPublishedBrands: vi.fn(async () => []),
    getPublishedBrandBySlug: vi.fn(async () => undefined),
    listPublishedProducts: vi.fn(async () => []),
    getPublishedProduct: vi.fn(async () => undefined),
    adminListBrands: vi.fn(async () => []),
    getBrandRow: vi.fn(),
    getProductRow: vi.fn(),
    createBrand: vi.fn(async (input: Record<string, unknown>) => ({ id: 1, status: "draft", ...input })),
    updateBrand: vi.fn(async (id: number, input: Record<string, unknown>) => ({ id, ...input })),
    setBrandStatus: vi.fn(async (id: number, status: string) => ({ id, status })),
    createProduct: vi.fn(async (brandId: number, input: Record<string, unknown>) => ({ id: 9, brandId, ...input })),
    saveOffer: vi.fn(async () => ({ id: 3 })),
    saveUserPreferences: vi.fn(async (_u: number, interests: string[], brandIds: number[]) => ({
      interests,
      brandIds,
      savedAt: new Date(),
    })),
    getUserPreferences: vi.fn(async () => ({ interests: [], brandIds: [], savedAt: null })),
  };
});

import { appRouter } from "./routers";
import * as db from "./brandsDb";

type User = NonNullable<TrpcContext["user"]>;

function ctxFor(role: "user" | "admin" | null, id = 1): TrpcContext {
  const user: User | null = role
    ? {
        id,
        openId: `u-${id}`,
        username: `u${id}`,
        email: null,
        name: `U${id}`,
        loginMethod: "supabase",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;
  return { user, req: { headers: {} }, res: {} } as TrpcContext;
}

const caller = (role: "user" | "admin" | null, id = 1) => appRouter.createCaller(ctxFor(role, id));

const validBrand = {
  slug: "lizin",
  name: "Lizin",
  description: "Marca de produtos capilares.",
  communicationConcept: "Liso no seu tempo",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("brands — acesso", () => {
  it("lista pública só consulta marcas publicadas", async () => {
    const result = await caller(null).brands.listPublished();
    expect(result).toEqual([]);
    expect(db.listPublishedBrands).toHaveBeenCalled();
  });

  it("marca em rascunho/inexistente retorna NOT_FOUND no público", async () => {
    await expect(caller(null).brands.getBySlug({ slug: "lizin" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller(null).brands.getProduct({ brandSlug: "lizin", productSlug: "x" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("anônimo não acessa a administração", async () => {
    await expect(caller(null).brands.admin.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller(null).brands.admin.saveBrand(validBrand)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("usuário comum não acessa a administração (nenhuma escrita é feita)", async () => {
    const user = caller("user");
    await expect(user.brands.admin.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(user.brands.admin.saveBrand(validBrand)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(user.brands.admin.setBrandStatus({ id: 1, status: "published" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      user.brands.admin.saveOffer({ brandProductId: 1, channel: "outro", url: "https://x.com" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      user.brands.admin.uploadImage({ kind: "logo", base64: "A".repeat(40), mime: "image/png" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.createBrand).not.toHaveBeenCalled();
    expect(db.setBrandStatus).not.toHaveBeenCalled();
  });
});

describe("brands — regras no servidor (admin)", () => {
  it("cria marca sempre como rascunho", async () => {
    const created = await caller("admin").brands.admin.saveBrand({ ...validBrand, slug: " Lizin " });
    expect(db.createBrand).toHaveBeenCalledWith(expect.objectContaining({ slug: "lizin" }), 1);
    expect(created).toMatchObject({ status: "draft" });
  });

  it("rejeita slug inválido, cor inválida e URLs não http(s)", async () => {
    const admin = caller("admin");
    await expect(admin.brands.admin.saveBrand({ ...validBrand, slug: "Minha Marca" })).rejects.toThrow();
    await expect(admin.brands.admin.saveBrand({ ...validBrand, accentColor: "red" })).rejects.toThrow();
    await expect(
      admin.brands.admin.saveBrand({ ...validBrand, logoUrl: "javascript:alert(1)" })
    ).rejects.toThrow();
    expect(db.createBrand).not.toHaveBeenCalled();
  });

  it("não publica marca sem descrição", async () => {
    vi.mocked(db.getBrandRow).mockResolvedValue({
      id: 1,
      slug: "lizin",
      name: "Lizin",
      description: null,
      status: "draft",
    } as never);
    await expect(caller("admin").brands.admin.setBrandStatus({ id: 1, status: "published" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(db.setBrandStatus).not.toHaveBeenCalled();
  });

  it("publica marca completa e arquiva marca publicada", async () => {
    vi.mocked(db.getBrandRow).mockResolvedValue({
      id: 1,
      slug: "lizin",
      name: "Lizin",
      description: "ok",
      status: "draft",
    } as never);
    await caller("admin").brands.admin.setBrandStatus({ id: 1, status: "published" });
    expect(db.setBrandStatus).toHaveBeenCalledWith(1, "published");

    vi.mocked(db.getBrandRow).mockResolvedValue({ id: 1, slug: "lizin", name: "Lizin", description: "ok", status: "published" } as never);
    await caller("admin").brands.admin.setBrandStatus({ id: 1, status: "archived" });
    expect(db.setBrandStatus).toHaveBeenLastCalledWith(1, "archived");
  });

  it("marca arquivada só volta para rascunho", async () => {
    vi.mocked(db.getBrandRow).mockResolvedValue({ id: 1, slug: "lizin", name: "Lizin", description: "ok", status: "archived" } as never);
    await expect(caller("admin").brands.admin.setBrandStatus({ id: 1, status: "published" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await caller("admin").brands.admin.setBrandStatus({ id: 1, status: "draft" });
    expect(db.setBrandStatus).toHaveBeenCalledWith(1, "draft");
  });

  it("não edita marca publicada deixando-a sem descrição", async () => {
    vi.mocked(db.getBrandRow).mockResolvedValue({ id: 1, slug: "lizin", name: "Lizin", description: "ok", status: "published" } as never);
    await expect(
      caller("admin").brands.admin.saveBrand({ ...validBrand, id: 1, description: "" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.updateBrand).not.toHaveBeenCalled();
  });

  it("não cria produto em marca arquivada nem move produto entre marcas", async () => {
    const product = { brandId: 1, slug: "produto", name: "Produto" };
    vi.mocked(db.getBrandRow).mockResolvedValue({ id: 1, status: "archived" } as never);
    await expect(caller("admin").brands.admin.saveProduct(product)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createProduct).not.toHaveBeenCalled();

    vi.mocked(db.getProductRow).mockResolvedValue({ id: 5, brandId: 2, status: "draft" } as never);
    await expect(caller("admin").brands.admin.saveProduct({ ...product, id: 5 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("oferta aceita só link http(s) e canal conhecido", async () => {
    vi.mocked(db.getProductRow).mockResolvedValue({ id: 5, brandId: 1, status: "draft" } as never);
    const admin = caller("admin");
    await expect(
      admin.brands.admin.saveOffer({ brandProductId: 5, channel: "outro", url: "javascript:alert(1)" })
    ).rejects.toThrow();
    await expect(
      admin.brands.admin.saveOffer({ brandProductId: 5, channel: "inexistente" as never, url: "https://x.com" })
    ).rejects.toThrow();
    await admin.brands.admin.saveOffer({ brandProductId: 5, channel: "tiktok_shop", url: "https://shop.tiktok.com/x" });
    expect(db.saveOffer).toHaveBeenCalledTimes(1);
  });

  it("converte conflito de slug em CONFLICT", async () => {
    vi.mocked(db.createBrand).mockRejectedValueOnce(new db.BrandsDbError("SLUG_TAKEN", "Este identificador de URL já está em uso."));
    await expect(caller("admin").brands.admin.saveBrand(validBrand)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("movement — preferências", () => {
  it("exige login", async () => {
    await expect(caller(null).movement.preferences()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller(null).movement.savePreferences({ interests: [], brandIds: [] })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("salva apenas para o próprio usuário, sem duplicatas, e aceita vazio", async () => {
    await caller("user", 42).movement.savePreferences({
      interests: ["learn", "learn", "sell"],
      brandIds: [3, 3],
    });
    expect(db.saveUserPreferences).toHaveBeenCalledWith(42, ["learn", "sell"], [3]);

    await caller("user", 42).movement.savePreferences({ interests: [], brandIds: [] });
    expect(db.saveUserPreferences).toHaveBeenLastCalledWith(42, [], []);
  });

  it("rejeita interesse desconhecido (interesse não vira permissão)", async () => {
    await expect(
      caller("user").movement.savePreferences({ interests: ["admin" as never], brandIds: [] })
    ).rejects.toThrow();
  });
});
