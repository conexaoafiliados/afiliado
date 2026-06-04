import { boolean, decimal, integer, pgEnum, pgTable, serial, text, timestamp, varchar, } from "drizzle-orm/pg-core";
export const roleEnum = pgEnum("user_role", ["user", "admin"]);
export const missionCategoryEnum = pgEnum("mission_category", ["growth", "engagement", "learning"]);
export const missionDifficultyEnum = pgEnum("mission_difficulty", ["easy", "medium", "hard"]);
export const missionStatusEnum = pgEnum("mission_status", ["pending", "in_progress", "completed"]);
export const courseCategoryEnum = pgEnum("course_category", ["content", "growth", "monetization"]);
export const courseLevelEnum = pgEnum("course_level", ["beginner", "intermediate", "advanced"]);
export const productCategoryEnum = pgEnum("product_category", ["digital", "physical"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "shipped", "delivered"]);
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: roleEnum("role").default("user").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});
export const creatorProfiles = pgTable("creator_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    bio: text("bio"),
    profileImageUrl: varchar("profileImageUrl", { length: 512 }),
    bannerImageUrl: varchar("bannerImageUrl", { length: 512 }),
    instagramHandle: varchar("instagramHandle", { length: 100 }),
    tiktokHandle: varchar("tiktokHandle", { length: 100 }),
    youtubeHandle: varchar("youtubeHandle", { length: 100 }),
    twitterHandle: varchar("twitterHandle", { length: 100 }),
    websiteUrl: varchar("websiteUrl", { length: 512 }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});
export const followerProgress = pgTable("follower_progress", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    currentFollowers: integer("currentFollowers").default(0).notNull(),
    targetFollowers: integer("targetFollowers").default(2000).notNull(),
    progressPercentage: decimal("progressPercentage", { precision: 5, scale: 2 }).default("0").notNull(),
    lastUpdated: timestamp("lastUpdated", { withTimezone: true }).defaultNow().notNull(),
});
export const missions = pgTable("missions", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: missionCategoryEnum("category").notNull(),
    difficulty: missionDifficultyEnum("difficulty").notNull(),
    reward: integer("reward").default(0).notNull(),
    imageUrl: varchar("imageUrl", { length: 512 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const userMissions = pgTable("user_missions", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    missionId: integer("missionId").notNull().references(() => missions.id),
    status: missionStatusEnum("status").default("pending").notNull(),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    pointsEarned: integer("pointsEarned").default(0),
});
export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: courseCategoryEnum("category").notNull(),
    level: courseLevelEnum("level").notNull(),
    imageUrl: varchar("imageUrl", { length: 512 }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const userCourses = pgTable("user_courses", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    courseId: integer("courseId").notNull().references(() => courses.id),
    progress: integer("progress").default(0).notNull(),
    completedAt: timestamp("completedAt", { withTimezone: true }),
});
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: productCategoryEnum("category").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: varchar("imageUrl", { length: 512 }),
    stock: integer("stock"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const productOrders = pgTable("product_orders", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    productId: integer("productId").notNull().references(() => products.id),
    quantity: integer("quantity").default(1).notNull(),
    totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const communityPosts = pgTable("community_posts", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    content: text("content").notNull(),
    imageUrl: varchar("imageUrl", { length: 512 }),
    likes: integer("likes").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});
export const postComments = pgTable("post_comments", {
    id: serial("id").primaryKey(),
    postId: integer("postId").notNull().references(() => communityPosts.id),
    userId: integer("userId").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const achievements = pgTable("achievements", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: varchar("imageUrl", { length: 512 }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const userAchievements = pgTable("user_achievements", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    achievementId: integer("achievementId").notNull().references(() => achievements.id),
    unlockedAt: timestamp("unlockedAt", { withTimezone: true }).defaultNow().notNull(),
});
export const courseLessons = pgTable("course_lessons", {
    id: serial("id").primaryKey(),
    courseId: integer("courseId").notNull().references(() => courses.id),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    videoUrl: varchar("videoUrl", { length: 512 }),
    order: integer("order").notNull(),
    duration: integer("duration"),
});
export const communityEvents = pgTable("community_events", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startDate: timestamp("startDate", { withTimezone: true }).notNull(),
    endDate: timestamp("endDate", { withTimezone: true }),
    imageUrl: varchar("imageUrl", { length: 512 }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export const analyticsDaily = pgTable("analytics_daily", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    date: timestamp("date", { withTimezone: true }).notNull(),
    followers: integer("followers").default(0).notNull(),
    engagementRate: decimal("engagementRate", { precision: 5, scale: 2 }).default("0").notNull(),
    salesCount: integer("salesCount").default(0).notNull(),
    salesRevenue: decimal("salesRevenue", { precision: 10, scale: 2 }).default("0").notNull(),
    courseCompletions: integer("courseCompletions").default(0).notNull(),
});
