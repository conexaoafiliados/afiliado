import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["user", "admin"]);
export const missionCategoryEnum = pgEnum("mission_category", ["growth", "engagement", "learning"]);
export const missionDifficultyEnum = pgEnum("mission_difficulty", ["easy", "medium", "hard"]);
export const missionStatusEnum = pgEnum("mission_status", ["pending", "in_progress", "completed"]);
export const courseCategoryEnum = pgEnum("course_category", ["content", "growth", "monetization"]);
export const courseLevelEnum = pgEnum("course_level", ["beginner", "intermediate", "advanced"]);
export const productCategoryEnum = pgEnum("product_category", ["digital", "physical"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "shipped", "delivered"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "post_like",
  "post_comment",
  "mention",
  "goal_unlock",
  "user_follow",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const creatorProfiles = pgTable("creator_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  bio: text("bio"),
  profileImageUrl: varchar("profileImageUrl", { length: 512 }),
  bannerImageUrl: varchar("bannerImageUrl", { length: 512 }),
  cep: varchar("cep", { length: 9 }),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 20 }),
  neighborhood: varchar("neighborhood", { length: 120 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 2 }),
  age: integer("age"),
  platformObjective: text("platformObjective"),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  tiktokHandle: varchar("tiktokHandle", { length: 100 }),
  tiktokOpenId: varchar("tiktokOpenId", { length: 64 }),
  tiktokAccessToken: text("tiktokAccessToken"),
  tiktokRefreshToken: text("tiktokRefreshToken"),
  tiktokTokenExpiresAt: timestamp("tiktokTokenExpiresAt", { withTimezone: true }),
  tiktokLinkedAt: timestamp("tiktokLinkedAt", { withTimezone: true }),
  tiktokDisplayName: varchar("tiktokDisplayName", { length: 120 }),
  youtubeHandle: varchar("youtubeHandle", { length: 100 }),
  twitterHandle: varchar("twitterHandle", { length: 100 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfiles.$inferInsert;

export const followerProgress = pgTable("follower_progress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  currentFollowers: integer("currentFollowers").default(0).notNull(),
  targetFollowers: integer("targetFollowers").default(2000).notNull(),
  progressPercentage: decimal("progressPercentage", { precision: 5, scale: 2 }).default("0").notNull(),
  source: varchar("source", { length: 20 }).default("manual").notNull(),
  tiktokLastSyncAt: timestamp("tiktokLastSyncAt", { withTimezone: true }),
  lastUpdated: timestamp("lastUpdated", { withTimezone: true }).defaultNow().notNull(),
});

export const followerHistory = pgTable("follower_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  followers: integer("followers").notNull(),
  source: varchar("source", { length: 20 }).default("manual").notNull(),
  recordedAt: timestamp("recordedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type FollowerProgress = typeof followerProgress.$inferSelect;
export type InsertFollowerProgress = typeof followerProgress.$inferInsert;
export type FollowerHistory = typeof followerHistory.$inferSelect;

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
  channel: varchar("channel", { length: 32 }).default("feed").notNull(),
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
  parentCommentId: integer("parentCommentId"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull().references(() => communityPosts.id),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull().references(() => users.id),
  followingId: integer("followingId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    permission: varchar("permission", { length: 64 }).notNull(),
    grantedBy: integer("grantedBy").references(() => users.id),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  t => [unique().on(t.userId, t.permission)]
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  actorUserId: integer("actorUserId").references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  link: varchar("link", { length: 512 }),
  read: boolean("read").default(false).notNull(),
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

export const learningTracks = pgTable("learning_tracks", {
  slug: varchar("slug", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  emoji: varchar("emoji", { length: 16 }),
  welcomeEnabled: boolean("welcomeEnabled").default(false).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
});

export const learningSections = pgTable("learning_sections", {
  id: serial("id").primaryKey(),
  trackSlug: varchar("trackSlug", { length: 64 }).notNull().references(() => learningTracks.slug),
  slug: varchar("slug", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  sectionNumber: integer("sectionNumber"),
  sortOrder: integer("sortOrder").notNull(),
});

export const learningLessons = pgTable("learning_lessons", {
  id: serial("id").primaryKey(),
  sectionId: integer("sectionId").notNull().references(() => learningSections.id),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  lessonLabel: varchar("lessonLabel", { length: 32 }),
  title: varchar("title", { length: 255 }).notNull(),
  durationSeconds: integer("durationSeconds"),
  /** ID ou URL do YouTube — preencher no Supabase quando o vídeo estiver pronto */
  youtubeVideoId: varchar("youtubeVideoId", { length: 128 }),
  sortOrder: integer("sortOrder").notNull(),
});

export const lessonLikes = pgTable("lesson_likes", {
  id: serial("id").primaryKey(),
  lessonSlug: varchar("lessonSlug", { length: 128 }).notNull(),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const lessonComments = pgTable("lesson_comments", {
  id: serial("id").primaryKey(),
  lessonSlug: varchar("lessonSlug", { length: 128 }).notNull(),
  userId: integer("userId").notNull().references(() => users.id),
  parentCommentId: integer("parentCommentId"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
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

export const trainingEvents = pgTable("training_events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  category: varchar("category", { length: 64 }).default("geral").notNull(),
  eventType: varchar("eventType", { length: 32 }).default("live").notNull(),
  hostName: varchar("hostName", { length: 120 }),
  startDate: timestamp("startDate", { withTimezone: true }).notNull(),
  endDate: timestamp("endDate", { withTimezone: true }),
  liveStreamUrl: varchar("liveStreamUrl", { length: 512 }),
  seedParticipants: integer("seedParticipants").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const trainingEventRegistrations = pgTable("training_event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull().references(() => trainingEvents.id),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  channel: varchar("channel", { length: 32 }).default("avisos").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  attachmentUrl: varchar("attachmentUrl", { length: 512 }),
  attachmentName: varchar("attachmentName", { length: 255 }),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const announcementLikes = pgTable("announcement_likes", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcementId").notNull().references(() => announcements.id),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const announcementComments = pgTable("announcement_comments", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcementId").notNull().references(() => announcements.id),
  userId: integer("userId").notNull().references(() => users.id),
  parentCommentId: integer("parentCommentId"),
  content: text("content").notNull(),
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
