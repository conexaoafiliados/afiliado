import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
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
  notifications,
  postComments,
  postLikes,
  products,
  userAchievements,
  userCourses,
  userMissions,
  users,
} from "../drizzle/schema";
import { resolveFollowerGoal, formatGoalLabel } from "./_core/goals";
import { extractMentionUsernames } from "./_core/mentions";
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
  const existing = await getFollowerProgress(userId);
  const currentTarget = existing?.targetFollowers ?? 2000;
  const { targetFollowers, progressPercentage, goalCompleted, completedTarget } = resolveFollowerGoal(
    currentTarget,
    followers
  );
  await upsertFollowerProgress(userId, {
    currentFollowers: followers,
    targetFollowers,
    progressPercentage: progressPercentage.toFixed(2),
    source,
    tiktokLastSyncAt: source === "tiktok" ? new Date() : undefined,
    lastUpdated: new Date(),
  });
  if (goalCompleted && followers >= completedTarget) {
    const nextLabel = formatGoalLabel(targetFollowers);
    await createNotification({
      userId,
      type: "goal_unlock",
      title: "Nova meta desbloqueada!",
      body: `Você passou de ${formatGoalLabel(completedTarget)} seguidores. Próxima meta: ${nextLabel}.`,
      link: "/growth/progress",
    });
  }
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

export async function updateUserById(userId: number, fields: { name?: string }) {
  const db = await getDb();
  if (!db) return;
  if (!fields.name) return;
  await db.update(users).set({ name: fields.name, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function searchUsersByUsername(query: string, limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return db
    .select({ id: users.id, username: users.username, name: users.name })
    .from(users)
    .where(ilike(users.username, `${q}%`))
    .limit(limit);
}

export async function getUsersByUsernames(usernames: string[]) {
  const db = await getDb();
  if (!db || usernames.length === 0) return [];
  const lowered = usernames.map(u => u.toLowerCase());
  return db
    .select({ id: users.id, username: users.username, name: users.name })
    .from(users)
    .where(inArray(users.username, lowered));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getCommunityPostById(postId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  return result[0];
}

export async function getCommunityFeed(viewerUserId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const posts = await db
    .select()
    .from(communityPosts)
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit)
    .offset(offset);
  if (posts.length === 0) return [];

  const postIds = posts.map(p => p.id);
  const authorIds = [...new Set(posts.map(p => p.userId))];

  const authors = await db
    .select({ id: users.id, name: users.name, username: users.username })
    .from(users)
    .where(inArray(users.id, authorIds));
  const authorMap = new Map(authors.map(a => [a.id, a]));

  const commentCounts = await db
    .select({
      postId: postComments.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(postComments)
    .where(inArray(postComments.postId, postIds))
    .groupBy(postComments.postId);

  const countMap = new Map(commentCounts.map(c => [c.postId, c.count]));

  const viewerLikes = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(eq(postLikes.userId, viewerUserId), inArray(postLikes.postId, postIds)));

  const likedSet = new Set(viewerLikes.map(l => l.postId));

  return posts.map(post => {
    const author = authorMap.get(post.userId);
    return {
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl,
      likes: post.likes,
      commentCount: countMap.get(post.id) ?? 0,
      liked: likedSet.has(post.id),
      createdAt: post.createdAt,
      authorName: author?.name || author?.username || "Creator",
      authorUsername: author?.username ?? null,
    };
  });
}

export async function createCommunityPost(userId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  const [post] = await db
    .insert(communityPosts)
    .values({
      userId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: communityPosts.id });
  await notifyMentionsInContent({
    content,
    actorUserId: userId,
    link: "/community/feed",
    context: "mencionou você em um post",
  });
  return post?.id ?? null;
}

export async function togglePostLike(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return { liked: false, likes: 0 };
  const post = await getCommunityPostById(postId);
  if (!post) return { liked: false, likes: 0 };

  const existing = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .limit(1);

  let liked: boolean;
  if (existing.length > 0) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
    liked = false;
    const newCount = Math.max(0, post.likes - 1);
    await db.update(communityPosts).set({ likes: newCount }).where(eq(communityPosts.id, postId));
    return { liked, likes: newCount };
  }

  await db.insert(postLikes).values({ postId, userId });
  liked = true;
  const newCount = post.likes + 1;
  await db.update(communityPosts).set({ likes: newCount }).where(eq(communityPosts.id, postId));

  if (post.userId !== userId) {
    const actor = await getUserById(userId);
    await createNotification({
      userId: post.userId,
      actorUserId: userId,
      type: "post_like",
      title: "Nova curtida no seu post",
      body: `${actor?.name || actor?.username || "Alguém"} curtiu sua publicação.`,
      link: "/community/feed",
    });
  }

  return { liked, likes: newCount };
}

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const comments = await db
    .select()
    .from(postComments)
    .where(eq(postComments.postId, postId))
    .orderBy(desc(postComments.createdAt));

  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map(c => c.userId))];
  const authors = await db
    .select({ id: users.id, name: users.name, username: users.username })
    .from(users)
    .where(inArray(users.id, userIds));
  const authorMap = new Map(authors.map(a => [a.id, a]));

  return comments.map(c => {
    const author = authorMap.get(c.userId);
    return {
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      content: c.content,
      createdAt: c.createdAt,
      authorName: author?.name || author?.username || "Creator",
      authorUsername: author?.username ?? null,
    };
  });
}

export async function createPostComment(userId: number, postId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  const post = await getCommunityPostById(postId);
  if (!post) return null;

  const [comment] = await db
    .insert(postComments)
    .values({ postId, userId, content })
    .returning({ id: postComments.id });

  const actor = await getUserById(userId);
  const actorLabel = actor?.name || actor?.username || "Alguém";

  if (post.userId !== userId) {
    await createNotification({
      userId: post.userId,
      actorUserId: userId,
      type: "post_comment",
      title: "Novo comentário",
      body: `${actorLabel} comentou no seu post.`,
      link: "/community/feed",
    });
  }

  await notifyMentionsInContent({
    content,
    actorUserId: userId,
    link: "/community/feed",
    context: "mencionou você em um comentário",
    excludeUserId: post.userId,
  });

  return comment?.id ?? null;
}

async function notifyMentionsInContent(opts: {
  content: string;
  actorUserId: number;
  link: string;
  context: string;
  excludeUserId?: number;
}) {
  const usernames = extractMentionUsernames(opts.content);
  if (usernames.length === 0) return;
  const mentioned = await getUsersByUsernames(usernames);
  const actor = await getUserById(opts.actorUserId);
  const actorLabel = actor?.name || actor?.username || "Alguém";

  for (const user of mentioned) {
    if (user.id === opts.actorUserId) continue;
    if (opts.excludeUserId && user.id === opts.excludeUserId) continue;
    await createNotification({
      userId: user.id,
      actorUserId: opts.actorUserId,
      type: "mention",
      title: "Você foi marcado",
      body: `${actorLabel} ${opts.context}.`,
      link: opts.link,
    });
  }
}

export async function createNotification(data: {
  userId: number;
  actorUserId?: number;
  type: "post_like" | "post_comment" | "mention" | "goal_unlock";
  title: string;
  body?: string;
  link?: string;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notifications).values({
      userId: data.userId,
      actorUserId: data.actorUserId ?? null,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      link: data.link ?? null,
    });
  } catch (e) {
    console.warn("[Database] createNotification failed:", e);
  }
}

export async function getNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
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
