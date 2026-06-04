# Conexões Creator — Mapa da plataforma

Referência alinhada ao escopo entregue no Manus e ao estado deste repositório.

## Rotas

| Rota | Página | Status |
|------|--------|--------|
| `/` | Home | ✅ |
| `/login` | Login (Supabase) | ✅ |
| `/profile/edit` | Perfil | ✅ |
| `/dashboard` | Dashboard | ✅ |
| `/growth/missions` | Missões | ✅ + API tRPC |
| `/growth/achievements` | Conquistas | ✅ |
| `/growth/progress` | Progresso 2K | ✅ |
| `/courses/browse` | Cursos | ✅ UI (dados demo/API) |
| `/shop/browse` | Loja | ✅ |
| `/community/feed` | Comunidade | ✅ |
| `/analytics/overview` | Analytics | ✅ gráficos Recharts |
| `/checkout` | Checkout Stripe | ✅ |
| `/orders` | Pedidos | ✅ |

## Módulos

| Módulo | Manus (original) | Este repo |
|--------|------------------|-----------|
| Auth | OAuth Manus | **Supabase** (magic link) |
| Perfil creator | bio, redes | ✅ tRPC `profile` |
| Dashboard | métricas, progresso | ✅ |
| Gamificação | missões, conquistas, barra | ✅ 3 rotas `/growth/*` |
| Cursos | catálogo + progresso | ✅ API `courses` |
| Loja + Stripe | checkout + webhook | ✅ |
| Comunidade | feed, posts, likes | ✅ |
| Analytics | Recharts | ✅ |
| PWA | manifest + SW | ✅ `client/public/` |
| Mentor IA | LLM | 🔜 próxima fase |
| Notificações push | marcos 500/1k/2k | 🔜 próxima fase |

## Backend tRPC

- `auth`, `profile`, `progress`
- `missions`, `achievements`, `courses`, `shop`, `community`, `payments`, `orders`
- `system.health`

## Banco (16 tabelas)

Ver `supabase/schema.sql` e `drizzle/schema.ts`.

Opcional: `supabase/seed.sql` para missões, conquistas e cursos de exemplo.

## Testes

```bash
npm test
```

7 testes em `server/routers.test.ts` (auth, system, routers protegidos).
