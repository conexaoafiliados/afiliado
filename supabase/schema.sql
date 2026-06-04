-- Conexões Creator — execute no SQL Editor do Supabase
-- Se aparecer "type already exists", o schema JÁ foi criado — não rode de novo.
-- Use apenas supabase/seed.sql para dados de exemplo.

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mission_category AS ENUM ('growth', 'engagement', 'learning'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mission_difficulty AS ENUM ('easy', 'medium', 'hard'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mission_status AS ENUM ('pending', 'in_progress', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE course_category AS ENUM ('content', 'growth', 'monetization'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_category AS ENUM ('digital', 'physical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role user_role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  "profileImageUrl" VARCHAR(512),
  "bannerImageUrl" VARCHAR(512),
  "instagramHandle" VARCHAR(100),
  "tiktokHandle" VARCHAR(100),
  "youtubeHandle" VARCHAR(100),
  "twitterHandle" VARCHAR(100),
  "websiteUrl" VARCHAR(512),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follower_progress (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "currentFollowers" INTEGER NOT NULL DEFAULT 0,
  "targetFollowers" INTEGER NOT NULL DEFAULT 2000,
  "progressPercentage" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category mission_category NOT NULL,
  difficulty mission_difficulty NOT NULL,
  reward INTEGER NOT NULL DEFAULT 0,
  "imageUrl" VARCHAR(512),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_missions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "missionId" INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  status mission_status NOT NULL DEFAULT 'pending',
  "completedAt" TIMESTAMPTZ,
  "pointsEarned" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "imageUrl" VARCHAR(512),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "achievementId" INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  "unlockedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category course_category NOT NULL,
  level course_level NOT NULL,
  "imageUrl" VARCHAR(512),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id SERIAL PRIMARY KEY,
  "courseId" INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  "videoUrl" VARCHAR(512),
  "order" INTEGER NOT NULL,
  duration INTEGER
);

CREATE TABLE IF NOT EXISTS user_courses (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "courseId" INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  "imageUrl" VARCHAR(512),
  stock INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_orders (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  "totalPrice" NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "imageUrl" VARCHAR(512),
  likes INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ,
  "imageUrl" VARCHAR(512),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_daily (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  "engagementRate" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "salesRevenue" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "courseCompletions" INTEGER NOT NULL DEFAULT 0
);

-- RLS: habilite conforme sua política de segurança no Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
