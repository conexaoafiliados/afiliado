import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  communityPosts,
  courses,
  creatorProfiles,
  followerProgress,
  followerHistory,
  InsertCreatorProfile,
  InsertFollowerProgress,
  InsertUser,
  achievements,
  missions,
  postComments,
  products,
  userAchievements,
  userCourses,
  userMissions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      const client = postgres(ENV.databaseUrl, {
        prepare: false,
        ssl: "require",
        connect_timeout: 10,
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  for (const field of ["name", "email", "loginMethod", "username"] as const) {
    const value = user[field];
    if (value === undefined) continue;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  try {
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: { ...updateSet, updatedAt: sql`NOW()` },
      });
  } catch (error) {
    console.error("[Database] upsertUser failed:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] getUserByOpenId failed:", error);
    return undefined;
  }
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] getUserByUsername failed:", error);
    return undefined;
  }
}

export async function getCreatorProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertCreatorProfile(userId: number, profile: Partial<InsertCreatorProfile>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getCreatorProfile(userId);
  if (existing) {
    await db.update(creatorProfiles).set({ ...profile, updatedAt: new Date() }).where(eq(creatorProfiles.userId, userId));
  } else {
    await db.insert(creatorProfiles).values({ userId, ...profile });
  }
}

export async function getFollowerProgress(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(followerProgress).where(eq(followerProgress.userId, userId)).limit(1);
  return result[0];
}

export async function upsertFollowerProgress(userId: number, progress: Partial<InsertFollowerProgress>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getFollowerProgress(userId);
  if (existing) {
    await db.update(followerProgress).set({ ...progress, lastUpdated: new Date() }).where(eq(followerProgress.userId, userId));
  } else {
    await db.insert(followerProgress).values({ userId, ...progress });
  }
}

export async function recordFollowerSnapshot(
  userId: number,
  followers: number,
  source: "manual" | "tiktok" = "manual"
) {
  const db = await getDb();
  if (!db) return;
  const target = 2000;
  const pct = Math.min(100, (followers / target) * 100);
  await upsertFollowerProgress(userId, {
    currentFollowers: followers,
    targetFollowers: target,
    progressPercentage: pct.toFixed(2),
    source,
    tiktokLastSyncAt: source === "tiktok" ? new Date() : undefined,
    lastUpdated: new Date(),
  });
  try {
    await db.insert(followerHistory).values({ userId, followers, source });
  } catch (e) {
    console.warn("[Database] follower_history insert failed:", e);
  }
}

export async function getFollowerHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  try {
    return db
      .select()
      .from(followerHistory)
      .where(eq(followerHistory.userId, userId))
      .orderBy(desc(followerHistory.recordedAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function saveTikTokConnection(
  userId: number,
  data: {
    openId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    displayName?: string;
    username?: string;
  }
) {
  await upsertCreatorProfile(userId, {
    tiktokOpenId: data.openId,
    tiktokAccessToken: data.accessToken,
    tiktokRefreshToken: data.refreshToken,
    tiktokTokenExpiresAt: data.expiresAt,
    tiktokLinkedAt: new Date(),
    tiktokDisplayName: data.displayName,
    tiktokHandle: data.username ?? undefined,
  });
}

export async function getTikTokTokens(userId: number) {
  const profile = await getCreatorProfile(userId);
  if (!profile?.tiktokAccessToken || !profile.tiktokRefreshToken) return null;
  return {
    openId: profile.tiktokOpenId,
    accessToken: profile.tiktokAccessToken,
    refreshToken: profile.tiktokRefreshToken,
    expiresAt: profile.tiktokTokenExpiresAt,
    displayName: profile.tiktokDisplayName,
    username: profile.tiktokHandle,
    linkedAt: profile.tiktokLinkedAt,
  };
}

export async function clearTikTokConnection(userId: number) {
  await upsertCreatorProfile(userId, {
    tiktokOpenId: null,
    tiktokAccessToken: null,
    tiktokRefreshToken: null,
    tiktokTokenExpiresAt: null,
    tiktokLinkedAt: null,
    tiktokDisplayName: null,
  });
}

export async function getMissionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userMissions).where(eq(userMissions.userId, userId));
}

export async function createUserMission(userId: number, missionId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userMissions).values({ userId, missionId, status: "in_progress" });
}

export async function getCoursesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userCourses).where(eq(userCourses.userId, userId));
}

export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses);
}

export async function enrollCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userCourses).values({ userId, courseId, progress: 0 });
}

export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId));
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products);
}

export async function createProduct(userId: number, product: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values({
    userId,
    title: String(product.title),
    description: product.description ? String(product.description) : null,
    category: product.category as "digital" | "physical",
    price: String(product.price),
    stock: product.stock != null ? Number(product.stock) : null,
    imageUrl: product.imageUrl ? String(product.imageUrl) : null,
  });
}

export async function getCommunityPosts(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts).limit(limit).offset(offset);
}

export async function createCommunityPost(userId: number, content: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(communityPosts).values({
    userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function likePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(postComments)
    .where(and(eq(postComments.postId, postId), eq(postComments.userId, userId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(postComments).values({ postId, userId, content: "👍" });
  }
}

export async function getAllMissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(missions).where(eq(missions.isActive, true));
}

export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievements);
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}
