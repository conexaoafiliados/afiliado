/**
 * Aplica migration_movimento_etapa1.sql + seed_brands_initial.sql via DATABASE_URL.
 * Uso local: node scripts/apply_movimento_etapa1.mjs
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL ausente no .env");
  process.exit(1);
}

const files = [
  "supabase/migration_movimento_etapa1.sql",
  "supabase/seed_brands_initial.sql",
];

const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });

try {
  for (const rel of files) {
    const full = path.join(root, rel);
    const body = fs.readFileSync(full, "utf8");
    console.log(`→ aplicando ${rel} (${body.length} chars)…`);
    await sql.unsafe(body);
    console.log(`  ok`);
  }

  const brands = await sql`
    SELECT slug, name, status, "logoUrl", "accentColor"
    FROM brands
    ORDER BY "sortOrder", name
  `;
  const products = await sql`
    SELECT b.slug AS brand, p.slug AS product, p.name, p.status
    FROM brand_products p
    JOIN brands b ON b.id = p."brandId"
    ORDER BY b."sortOrder", p."sortOrder"
  `;
  const offers = await sql`
    SELECT b.slug AS brand, p.slug AS product, o.url
    FROM brand_product_offers o
    JOIN brand_products p ON p.id = o."brandProductId"
    JOIN brands b ON b.id = p."brandId"
    ORDER BY b.slug, p.slug
  `;

  console.log("\nMarcas:", brands);
  console.log("Produtos:", products);
  console.log("Ofertas:", offers);
} catch (error) {
  console.error("Falha ao aplicar SQL:", error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
