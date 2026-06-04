# Conexões Creator

Um grupo de pessoas ajudando uns aos outros a crescer no TikTok — plataforma PWA para creators iniciantes: jornada gamificada até 2k seguidores, cursos, loja, comunidade e analytics.

## Stack

- **Frontend:** React + Vite + Tailwind
- **API:** Express + tRPC
- **Auth & DB:** [Supabase](https://supabase.com) (Auth + PostgreSQL)
- **Pagamentos:** Stripe (opcional)
- **Deploy:** [Vercel](https://vercel.com) + [GitHub](https://github.com/conexaoafiliados/afiliado)

## Setup local

### 1. Supabase — criar tabelas

No painel Supabase → **SQL Editor**, execute `supabase/schema.sql` (só uma vez).  
Se der erro `already exists`, o schema já foi criado — use `supabase/seed.sql` para dados de exemplo.

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha com valores **reais** do Supabase (não deixe `SEU_PROJETO` nem `sua_anon_key`):

| Variável | Onde pegar |
|----------|------------|
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `DATABASE_URL` | Settings → Database → URI (Transaction pooler) |

**Authentication** → **URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/dashboard`

**Importante:** após salvar o `.env`, reinicie o servidor (`Ctrl+C` → `npm run dev`).

### 3. Rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Deploy na Vercel

1. Push do código para `main` no GitHub
2. [vercel.com](https://vercel.com) → importar `conexaoafiliados/afiliado`
3. Framework: **Other**
4. Copiar variáveis do `.env.example` em **Environment Variables**
5. Deploy e adicionar URL da Vercel no Supabase (redirect)

## Estrutura

```
client/     # React
server/     # Express + tRPC
supabase/   # SQL
api/        # Vercel serverless
```

Repositório: https://github.com/conexaoafiliados/afiliado
