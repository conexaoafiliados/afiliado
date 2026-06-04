# Creator Growth Platform - Arquitetura e Planejamento

## 1. Visão Geral da Plataforma

Plataforma PWA elegante para creators iniciantes com foco em crescimento gamificado até 2k seguidores, educação, comunidade e vendas integradas.

---

## 2. Estrutura de Dados (Drizzle Schema)

### Tabelas Principais

#### `users` (existente)
- id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn

#### `creator_profiles`
- id, userId (FK), bio, profileImageUrl, bannerImageUrl, instagramHandle, tiktokHandle, youtubeHandle, twitterHandle, websiteUrl, createdAt, updatedAt

#### `follower_progress`
- id, userId (FK), currentFollowers, targetFollowers (2000), progressPercentage, lastUpdated

#### `missions`
- id, title, description, category (growth, engagement, learning), difficulty (easy, medium, hard), reward (points, followers), imageUrl, isActive, createdAt

#### `user_missions`
- id, userId (FK), missionId (FK), status (pending, in_progress, completed), completedAt, pointsEarned

#### `achievements`
- id, title, description, imageUrl, unlockedAt (nullable), createdAt

#### `user_achievements`
- id, userId (FK), achievementId (FK), unlockedAt

#### `courses`
- id, title, description, category (content, growth, monetization), level (beginner, intermediate, advanced), imageUrl, createdAt

#### `course_lessons`
- id, courseId (FK), title, content (markdown), videoUrl (nullable), order, duration (minutes)

#### `user_courses`
- id, userId (FK), courseId (FK), progress (0-100), completedAt (nullable)

#### `products`
- id, userId (FK), title, description, category (digital, physical), price, imageUrl, stock (nullable), createdAt

#### `product_orders`
- id, userId (FK), productId (FK), quantity, totalPrice, status (pending, paid, shipped, delivered), createdAt

#### `community_posts`
- id, userId (FK), content, imageUrl (nullable), likes, createdAt, updatedAt

#### `post_comments`
- id, postId (FK), userId (FK), content, createdAt

#### `community_events`
- id, title, description, startDate, endDate, imageUrl, createdAt

#### `analytics_daily`
- id, userId (FK), date, followers, engagementRate, salesCount, salesRevenue, courseCompletions

---

## 3. Rotas da Aplicação

### Estrutura de Navegação

```
/
├── / (Home/Dashboard)
├── /growth (Jornada 2k seguidores)
│   ├── /growth/missions
│   ├── /growth/achievements
│   └── /growth/progress
├── /courses (Educação)
│   ├── /courses/browse
│   ├── /courses/:courseId
│   └── /courses/my-courses
├── /shop (Loja)
│   ├── /shop/browse
│   ├── /shop/:productId
│   └── /shop/my-products
├── /community (Comunidade)
│   ├── /community/feed
│   ├── /community/events
│   └── /community/posts/:postId
├── /analytics (Métricas)
│   ├── /analytics/overview
│   ├── /analytics/engagement
│   └── /analytics/sales
├── /profile (Perfil)
│   ├── /profile/edit
│   ├── /profile/settings
│   └── /profile/:userId (perfil público)
└── /404 (Página não encontrada)
```

---

## 4. Design Visual - Sistema de Design

### Paleta de Cores

**Tema Elegante e Sofisticado:**

- **Primária**: `#1F2937` (Cinza escuro profundo)
- **Secundária**: `#7C3AED` (Roxo vibrante - destaque)
- **Accent**: `#EC4899` (Rosa/Magenta - ações)
- **Sucesso**: `#10B981` (Verde esmeralda)
- **Aviso**: `#F59E0B` (Âmbar)
- **Erro**: `#EF4444` (Vermelho)
- **Background**: `#FFFFFF` (Branco puro)
- **Surface**: `#F9FAFB` (Cinza muito claro)
- **Border**: `#E5E7EB` (Cinza claro)
- **Text**: `#111827` (Texto escuro)
- **Text Muted**: `#6B7280` (Texto secundário)

### Tipografia

- **Headings**: `Inter` (sans-serif) - Bold (700)
- **Body**: `Inter` (sans-serif) - Regular (400)
- **Accent**: `Poppins` (sans-serif) - SemiBold (600)

### Espaçamento

- Base: 4px
- Escala: 4, 8, 12, 16, 24, 32, 48, 64px

### Componentes Visuais

- **Radius**: 8px (padrão), 12px (cards), 16px (modais)
- **Shadows**: Soft (0 1px 3px rgba(0,0,0,0.1)), Medium (0 4px 6px rgba(0,0,0,0.1)), Large (0 10px 15px rgba(0,0,0,0.1))
- **Borders**: 1px solid, cor: border

### Padrões de Design

1. **Cards**: Background branco, sombra suave, radius 12px, padding 20px
2. **Buttons**: Altura 40px, padding 12px 24px, radius 8px, transição 200ms
3. **Inputs**: Altura 40px, border 1px, radius 8px, focus: border primária
4. **Progress Bars**: Altura 8px, radius 4px, animação suave
5. **Badges**: Padding 6px 12px, radius 20px, font-size 12px

---

## 5. Componentes Principais

### Componentes Reutilizáveis

1. **ProgressCard** - Exibe progresso com barra e percentual
2. **MissionCard** - Card de missão com ícone, título, recompensa
3. **AchievementBadge** - Badge de conquista com ícone
4. **CourseCard** - Card de curso com imagem, título, nível
5. **ProductCard** - Card de produto com preço e imagem
6. **PostCard** - Card de post da comunidade
7. **StatBox** - Box de métrica com ícone e valor
8. **TimelineItem** - Item de timeline para eventos

---

## 6. Fluxos Principais

### Fluxo de Autenticação
1. Usuário clica em "Entrar"
2. Redirecionado para OAuth Manus
3. Retorna com token
4. Cria perfil de creator automaticamente
5. Redirecionado para dashboard

### Fluxo de Missões
1. Usuário visualiza missões disponíveis
2. Clica em "Aceitar Missão"
3. Missão entra em "in_progress"
4. Usuário completa ação
5. Sistema valida e marca como "completed"
6. Pontos e recompensas são creditados

### Fluxo de Vendas
1. Creator cria produto (digital ou físico)
2. Produto aparece na loja
3. Outro creator compra produto
4. Pagamento processado (Stripe)
5. Produto entregue (download ou envio)
6. Vendedor recebe comissão

---

## 7. Integrações Externas

- **Stripe**: Processamento de pagamentos
- **Google Fonts**: Tipografia (Inter, Poppins)
- **Manus OAuth**: Autenticação
- **S3/Storage**: Armazenamento de imagens e arquivos

---

## 8. Considerações PWA

- **Manifest**: Configuração de ícones, nome, cores
- **Service Worker**: Cache de assets, suporte offline
- **Installability**: Critérios de instalação atendidos
- **Offline**: Funcionalidade limitada sem conexão

---

## 9. Próximos Passos

1. ✅ Projeto inicializado
2. → Implementar schema no Drizzle
3. → Criar rotas e componentes base
4. → Desenvolver autenticação e perfil
5. → Implementar gamificação
6. → Adicionar educação
7. → Integrar loja
8. → Desenvolver comunidade
9. → Analytics
10. → PWA completo
