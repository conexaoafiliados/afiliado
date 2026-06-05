import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  announcementComments,
  announcementLikes,
  announcements,
  communityPosts,
  courses,
  creatorProfiles,
  followerProgress,
  followerHistory,
  InsertCreatorProfile,
  InsertFollowerProgress,
  InsertUser,
  type FollowerHistory,
  achievements,
  learningLessons,
  learningSections,
  learningTracks,
  lessonComments,
  lessonLikes,
  missions,
  notifications,
  postComments,
  postLikes,
  productOrders,
  products,
  trainingEventRegistrations,
  trainingEvents,
  userAchievements,
  userCourses,
  userFollows,
  userMissions,
  users,
} from "../drizzle/schema";
import { achievementCongratsLabel, FOLLOWER_ACHIEVEMENTS } from "./_core/achievementRules";
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

let _parentCommentColumnExists: boolean | undefined;

async function hasParentCommentColumn(): Promise<boolean> {
  if (_parentCommentColumnExists !== undefined) return _parentCommentColumnExists;
  const db = await getDb();
  if (!db) {
    _parentCommentColumnExists = false;
    return false;
  }
  try {
    const rows = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'post_comments'
          AND a.attname = 'parentCommentId'
          AND NOT a.attisdropped
      ) AS exists
    `);
    const row = rows[0] as { exists?: boolean } | undefined;
    _parentCommentColumnExists = Boolean(row?.exists);
  } catch {
    _parentCommentColumnExists = false;
  }
  return _parentCommentColumnExists;
}

type PostCommentRow = {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  parentCommentId?: number | null;
};

async function fetchPostCommentsForPost(postId: number): Promise<PostCommentRow[]> {
  const db = await getDb();
  if (!db) return [];

  if (await hasParentCommentColumn()) {
    return db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));
  }

  const rows = await db
    .select({
      id: postComments.id,
      postId: postComments.postId,
      userId: postComments.userId,
      content: postComments.content,
      createdAt: postComments.createdAt,
    })
    .from(postComments)
    .where(eq(postComments.postId, postId))
    .orderBy(asc(postComments.createdAt));

  return rows.map(r => ({ ...r, parentCommentId: null }));
}

async function fetchPostCommentById(commentId: number): Promise<PostCommentRow | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  if (await hasParentCommentColumn()) {
    const result = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);
    return result[0];
  }

  const rows = await db
    .select({
      id: postComments.id,
      postId: postComments.postId,
      userId: postComments.userId,
      content: postComments.content,
      createdAt: postComments.createdAt,
    })
    .from(postComments)
    .where(eq(postComments.id, commentId))
    .limit(1);

  const row = rows[0];
  return row ? { ...row, parentCommentId: null } : undefined;
}

async function insertPostComment(
  postId: number,
  userId: number,
  content: string,
  parentCommentId?: number
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  if (await hasParentCommentColumn()) {
    const [comment] = await db
      .insert(postComments)
      .values({ postId, userId, content, parentCommentId: parentCommentId ?? null })
      .returning({ id: postComments.id });
    return comment?.id ?? null;
  }

  let finalContent = content;
  if (parentCommentId) {
    const parent = await fetchPostCommentById(parentCommentId);
    if (!parent || parent.postId !== postId) return null;
    const parentUser = await getUserById(parent.userId);
    if (parentUser?.username) {
      finalContent = `@${parentUser.username} ${content}`;
    }
  }

  const [comment] = await db
    .insert(postComments)
    .values({ postId, userId, content: finalContent })
    .returning({ id: postComments.id });

  return comment?.id ?? null;
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
  await syncFollowerAchievements(userId, followers);

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

export type FollowerChartPoint = {
  date: string;
  followers: number;
  source: string;
};

export function buildFollowerChart(
  history: FollowerHistory[],
  currentFollowers: number,
  source = "manual"
): FollowerChartPoint[] {
  const sorted = [...history].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const byDay = new Map<string, FollowerChartPoint & { recordedAt: Date }>();
  for (const h of sorted) {
    const date = new Date(h.recordedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    byDay.set(date, {
      date,
      followers: h.followers,
      source: h.source,
      recordedAt: new Date(h.recordedAt),
    });
  }

  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const todayEntry = byDay.get(today);
  if (!todayEntry || todayEntry.followers !== currentFollowers) {
    byDay.set(today, {
      date: today,
      followers: currentFollowers,
      source,
      recordedAt: new Date(),
    });
  }

  let chart = [...byDay.values()]
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .map(({ date, followers, source: src }) => ({ date, followers, source: src }));

  if (chart.length === 1 && currentFollowers > 0) {
    chart = [
      { date: "Início", followers: 0, source: "manual" },
      chart[0],
    ];
  }

  return chart;
}

export async function getSellerSalesAnalytics(userId: number) {
  const db = await getDb();
  const empty = {
    totalOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    recentOrders: [] as Array<{
      id: number;
      productTitle: string;
      totalPrice: string;
      status: string;
      createdAt: Date;
    }>,
    salesChart: [] as Array<{ date: string; revenue: number; orders: number }>,
  };
  if (!db) return empty;

  try {
    const orders = await db
      .select({
        id: productOrders.id,
        totalPrice: productOrders.totalPrice,
        status: productOrders.status,
        createdAt: productOrders.createdAt,
        productTitle: products.title,
      })
      .from(productOrders)
      .innerJoin(products, eq(productOrders.productId, products.id))
      .where(eq(products.userId, userId))
      .orderBy(desc(productOrders.createdAt))
      .limit(50);

    const paidStatuses = new Set(["paid", "delivered", "shipped"]);
    let totalOrders = 0;
    let paidOrders = 0;
    let totalRevenue = 0;
    let pendingRevenue = 0;
    const salesByDay = new Map<string, { revenue: number; orders: number }>();

    for (const o of orders) {
      totalOrders += 1;
      const price = parseFloat(String(o.totalPrice)) || 0;
      const day = new Date(o.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
      const bucket = salesByDay.get(day) ?? { revenue: 0, orders: 0 };

      if (paidStatuses.has(o.status)) {
        paidOrders += 1;
        totalRevenue += price;
        bucket.revenue += price;
        bucket.orders += 1;
      } else if (o.status === "pending") {
        pendingRevenue += price;
      }

      salesByDay.set(day, bucket);
    }

    const salesChart = [...salesByDay.entries()]
      .map(([date, stats]) => ({ date, ...stats }))
      .reverse()
      .slice(0, 14)
      .reverse();

    return {
      totalOrders,
      paidOrders,
      totalRevenue,
      pendingRevenue,
      recentOrders: orders.slice(0, 6).map(o => ({
        id: o.id,
        productTitle: o.productTitle,
        totalPrice: String(o.totalPrice),
        status: o.status,
        createdAt: o.createdAt,
      })),
      salesChart,
    };
  } catch (e) {
    console.warn("[Analytics] seller sales query failed:", e);
    return empty;
  }
}

export async function getUserCommunityAnalytics(userId: number) {
  const db = await getDb();
  const empty = { posts: 0, likesReceived: 0, commentsReceived: 0, platformFollowers: 0 };
  if (!db) return empty;

  try {
    const [postsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityPosts)
      .where(eq(communityPosts.userId, userId));

    const [likesRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postLikes)
      .innerJoin(communityPosts, eq(postLikes.postId, communityPosts.id))
      .where(eq(communityPosts.userId, userId));

    const [commentsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postComments)
      .innerJoin(communityPosts, eq(postComments.postId, communityPosts.id))
      .where(eq(communityPosts.userId, userId));

    const followStats = await getFollowStats(userId);

    return {
      posts: postsRow?.count ?? 0,
      likesReceived: likesRow?.count ?? 0,
      commentsReceived: commentsRow?.count ?? 0,
      platformFollowers: followStats.followers,
    };
  } catch (e) {
    console.warn("[Analytics] community stats query failed:", e);
    return empty;
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

export async function getCommunityFeed(
  viewerUserId: number,
  limit = 50,
  offset = 0,
  channel = "feed"
) {
  const db = await getDb();
  if (!db) return [];
  const order = channel === "grupo-aberto" ? asc(communityPosts.createdAt) : desc(communityPosts.createdAt);
  const posts = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.channel, channel))
    .orderBy(order)
    .limit(limit)
    .offset(offset);
  if (posts.length === 0) return [];

  const postIds = posts.map(p => p.id);
  const authorIds = [...new Set(posts.map(p => p.userId))];

  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      profileImageUrl: creatorProfiles.profileImageUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
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
      channel: post.channel,
      content: post.content,
      imageUrl: post.imageUrl,
      likes: post.likes,
      commentCount: countMap.get(post.id) ?? 0,
      liked: likedSet.has(post.id),
      createdAt: post.createdAt,
      authorName: author?.name || author?.username || "Creator",
      authorUsername: author?.username ?? null,
      authorProfileImageUrl: author?.profileImageUrl ?? null,
      authorRole: author?.role ?? "user",
    };
  });
}

export async function getCommunityPostsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const posts = await db
    .select()
    .from(communityPosts)
    .where(and(eq(communityPosts.userId, userId), eq(communityPosts.channel, "feed")))
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit);
  if (posts.length === 0) return [];

  const postIds = posts.map(p => p.id);
  const commentCounts = await db
    .select({
      postId: postComments.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(postComments)
    .where(inArray(postComments.postId, postIds))
    .groupBy(postComments.postId);
  const countMap = new Map(commentCounts.map(c => [c.postId, c.count]));

  return posts.map(post => ({
    id: post.id,
    content: post.content,
    likes: post.likes,
    commentCount: countMap.get(post.id) ?? 0,
    createdAt: post.createdAt,
  }));
}

export async function getUserPublicProfile(username: string, viewerId: number) {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const profile = await getCreatorProfile(user.id);
  const stats = await getFollowStats(user.id);
  const progress = await getFollowerProgress(user.id);
  const posts = await getCommunityPostsByUser(user.id, 20);

  const [card] = await enrichCreatorsWithFollowData(viewerId, [
    {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: profile?.bio ?? null,
      profileImageUrl: profile?.profileImageUrl ?? null,
      tiktokFollowers: progress?.currentFollowers ?? 0,
    },
  ]);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: profile?.bio ?? null,
    profileImageUrl: profile?.profileImageUrl ?? null,
    bannerImageUrl: profile?.bannerImageUrl ?? null,
    instagramHandle: profile?.instagramHandle ?? null,
    tiktokHandle: profile?.tiktokHandle ?? null,
    youtubeHandle: profile?.youtubeHandle ?? null,
    twitterHandle: profile?.twitterHandle ?? null,
    websiteUrl: profile?.websiteUrl ?? null,
    platformObjective: profile?.platformObjective ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    age: profile?.age ?? null,
    isOnline: isUserOnline(user.lastSignedIn),
    tiktokFollowers: progress?.currentFollowers ?? 0,
    targetFollowers: progress?.targetFollowers ?? 2000,
    platformFollowers: stats.followers,
    platformFollowing: stats.following,
    followStatus: card?.followStatus ?? "none",
    isSelf: user.id === viewerId,
    posts,
  };
}

export async function createCommunityPost(
  userId: number,
  content: string,
  options?: { channel?: string; imageUrl?: string }
) {
  const db = await getDb();
  if (!db) return null;
  const channel = options?.channel ?? "feed";
  const link = channel === "grupo-aberto" ? "/start/grupo-aberto" : "/community/feed";
  const [post] = await db
    .insert(communityPosts)
    .values({
      userId,
      channel,
      content,
      imageUrl: options?.imageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: communityPosts.id });
  await notifyMentionsInContent({
    content,
    actorUserId: userId,
    link,
    context: channel === "grupo-aberto" ? "mencionou você no Grupo Aberto" : "mencionou você em um post",
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

export async function getPostCommentById(commentId: number) {
  return fetchPostCommentById(commentId);
}

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const comments = await fetchPostCommentsForPost(postId);

  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map(c => c.userId))];
  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profileImageUrl: creatorProfiles.profileImageUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(inArray(users.id, userIds));
  const authorMap = new Map(authors.map(a => [a.id, a]));

  return comments.map(c => {
    const author = authorMap.get(c.userId);
    return {
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      parentCommentId: c.parentCommentId ?? null,
      content: c.content,
      createdAt: c.createdAt,
      authorName: author?.name || author?.username || "Creator",
      authorUsername: author?.username ?? null,
      authorProfileImageUrl: author?.profileImageUrl ?? null,
    };
  });
}

export async function createPostComment(
  userId: number,
  postId: number,
  content: string,
  parentCommentId?: number
) {
  const db = await getDb();
  if (!db) return null;
  const post = await getCommunityPostById(postId);
  if (!post) return null;

  if (parentCommentId) {
    const parent = await fetchPostCommentById(parentCommentId);
    if (!parent || parent.postId !== postId) return null;
  }

  const commentId = await insertPostComment(postId, userId, content, parentCommentId);
  if (!commentId) return null;

  const actor = await getUserById(userId);
  const actorLabel = actor?.name || actor?.username || "Alguém";

  if (parentCommentId) {
    const parent = await getPostCommentById(parentCommentId);
    if (parent && parent.userId !== userId) {
      await createNotification({
        userId: parent.userId,
        actorUserId: userId,
        type: "post_comment",
        title: "Resposta ao seu comentário",
        body: `${actorLabel} respondeu seu comentário.`,
        link: "/community/feed",
      });
    }
  } else if (post.userId !== userId) {
    await createNotification({
      userId: post.userId,
      actorUserId: userId,
      type: "post_comment",
      title: "Novo comentário",
      body: `${actorLabel} comentou no seu post.`,
      link: "/community/feed",
    });
  }

  const excludeMention = parentCommentId
    ? (await getPostCommentById(parentCommentId))?.userId
    : post.userId;

  await notifyMentionsInContent({
    content,
    actorUserId: userId,
    link: "/community/feed",
    context: parentCommentId ? "mencionou você em uma resposta" : "mencionou você em um comentário",
    excludeUserId: excludeMention,
  });

  return commentId;
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
  type: "post_like" | "post_comment" | "mention" | "goal_unlock" | "user_follow";
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

export type FollowStatus = "none" | "following" | "follower" | "mutual";

const ONLINE_THRESHOLD_MS = 15 * 60 * 1000;

export type CreatorCard = {
  id: number;
  name: string | null;
  username: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  tiktokFollowers: number;
  platformFollowers: number;
  followStatus: FollowStatus;
  isOnline: boolean;
};

function isUserOnline(lastSignedIn: Date | null | undefined): boolean {
  if (!lastSignedIn) return false;
  return Date.now() - new Date(lastSignedIn).getTime() < ONLINE_THRESHOLD_MS;
}

function resolveFollowStatus(iFollow: boolean, followsMe: boolean): FollowStatus {
  if (iFollow && followsMe) return "mutual";
  if (iFollow) return "following";
  if (followsMe) return "follower";
  return "none";
}

async function enrichCreatorsWithFollowData(
  viewerId: number,
  rows: Array<{
    id: number;
    name: string | null;
    username: string | null;
    bio: string | null;
    profileImageUrl: string | null;
    tiktokFollowers: number | null;
  }>
): Promise<CreatorCard[]> {
  const db = await getDb();
  if (!db || rows.length === 0) return [];

  const userIds = rows.map(r => r.id);

  const iFollowRows = await db
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(and(eq(userFollows.followerId, viewerId), inArray(userFollows.followingId, userIds)));

  const theyFollowRows = await db
    .select({ followerId: userFollows.followerId })
    .from(userFollows)
    .where(and(eq(userFollows.followingId, viewerId), inArray(userFollows.followerId, userIds)));

  const followerCounts = await db
    .select({
      userId: userFollows.followingId,
      count: sql<number>`count(*)::int`,
    })
    .from(userFollows)
    .where(inArray(userFollows.followingId, userIds))
    .groupBy(userFollows.followingId);

  const iFollowSet = new Set(iFollowRows.map(r => r.followingId));
  const theyFollowSet = new Set(theyFollowRows.map(r => r.followerId));
  const countMap = new Map(followerCounts.map(c => [c.userId, c.count]));

  const signIns = await db
    .select({ id: users.id, lastSignedIn: users.lastSignedIn })
    .from(users)
    .where(inArray(users.id, userIds));
  const signInMap = new Map(signIns.map(u => [u.id, u.lastSignedIn]));

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    username: row.username,
    bio: row.bio,
    profileImageUrl: row.profileImageUrl,
    tiktokFollowers: row.tiktokFollowers ?? 0,
    platformFollowers: countMap.get(row.id) ?? 0,
    followStatus: resolveFollowStatus(iFollowSet.has(row.id), theyFollowSet.has(row.id)),
    isOnline: isUserOnline(signInMap.get(row.id)),
  }));
}

export async function getFollowStats(userId: number) {
  const db = await getDb();
  if (!db) return { following: 0, followers: 0 };
  const [following] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));
  const [followers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));
  return {
    following: following?.count ?? 0,
    followers: followers?.count ?? 0,
  };
}

export async function discoverCreators(
  viewerId: number,
  opts: { query?: string; limit?: number; offset?: number } = {}
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [ne(users.id, viewerId)];
  if (opts.query?.trim()) {
    const q = `%${opts.query.trim().toLowerCase()}%`;
    conditions.push(or(ilike(users.username, q), ilike(users.name, q))!);
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: creatorProfiles.bio,
      profileImageUrl: creatorProfiles.profileImageUrl,
      tiktokFollowers: followerProgress.currentFollowers,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(followerProgress, eq(followerProgress.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(opts.limit ?? 20)
    .offset(opts.offset ?? 0);

  return enrichCreatorsWithFollowData(viewerId, rows);
}

export async function getFollowingCreators(viewerId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: creatorProfiles.bio,
      profileImageUrl: creatorProfiles.profileImageUrl,
      tiktokFollowers: followerProgress.currentFollowers,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followingId))
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(followerProgress, eq(followerProgress.userId, users.id))
    .where(eq(userFollows.followerId, viewerId))
    .orderBy(desc(userFollows.createdAt))
    .limit(limit);

  return enrichCreatorsWithFollowData(viewerId, rows);
}

export async function getFollowerCreators(viewerId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: creatorProfiles.bio,
      profileImageUrl: creatorProfiles.profileImageUrl,
      tiktokFollowers: followerProgress.currentFollowers,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(followerProgress, eq(followerProgress.userId, users.id))
    .where(eq(userFollows.followingId, viewerId))
    .orderBy(desc(userFollows.createdAt))
    .limit(limit);

  return enrichCreatorsWithFollowData(viewerId, rows);
}

export async function toggleUserFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return { following: false };

  const existing = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(userFollows).where(eq(userFollows.id, existing[0].id));
    return { following: false };
  }

  await db.insert(userFollows).values({ followerId, followingId });

  const actor = await getUserById(followerId);
  await createNotification({
    userId: followingId,
    actorUserId: followerId,
    type: "user_follow",
    title: "Novo seguidor",
    body: `${actor?.name || actor?.username || "Alguém"} começou a seguir você.`,
    link: "/community/feed",
  });

  return { following: true };
}

export async function getAllMissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(missions).where(eq(missions.isActive, true));
}

export async function ensureFollowerAchievementsCatalog() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ title: achievements.title }).from(achievements);
  const titles = new Set(existing.map(a => a.title));
  for (const def of FOLLOWER_ACHIEVEMENTS) {
    if (!titles.has(def.title)) {
      await db.insert(achievements).values({ title: def.title, description: def.description });
    }
  }
}

export async function syncFollowerAchievements(userId: number, followers: number) {
  const db = await getDb();
  if (!db) return { newlyUnlocked: [] as string[] };

  await ensureFollowerAchievementsCatalog();
  const all = await db.select().from(achievements);
  const userUnlocks = await getUserAchievements(userId);
  const unlockedIds = new Set(userUnlocks.map(u => u.achievementId));
  const newlyUnlocked: string[] = [];

  for (const def of FOLLOWER_ACHIEVEMENTS) {
    if (followers < def.threshold) continue;
    const achievement = all.find(a => a.title === def.title);
    if (!achievement || unlockedIds.has(achievement.id)) continue;

    try {
      await db.insert(userAchievements).values({ userId, achievementId: achievement.id });
      unlockedIds.add(achievement.id);
      newlyUnlocked.push(def.title);
      await createNotification({
        userId,
        type: "goal_unlock",
        title: `Conquista: ${def.title}`,
        body: `Parabéns! Você atingiu ${achievementCongratsLabel(def.threshold)}.`,
        link: "/growth/achievements",
      });
    } catch (e) {
      console.warn("[Database] unlock achievement failed:", e);
    }
  }

  return { newlyUnlocked };
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

export async function getLessonEngagement(lessonSlug: string, userId: number) {
  const db = await getDb();
  if (!db) return { likes: 0, liked: false, commentCount: 0 };

  const [likeRows, userLike, commentRows] = await Promise.all([
    db.select({ id: lessonLikes.id }).from(lessonLikes).where(eq(lessonLikes.lessonSlug, lessonSlug)),
    db
      .select({ id: lessonLikes.id })
      .from(lessonLikes)
      .where(and(eq(lessonLikes.lessonSlug, lessonSlug), eq(lessonLikes.userId, userId)))
      .limit(1),
    db
      .select({ id: lessonComments.id })
      .from(lessonComments)
      .where(eq(lessonComments.lessonSlug, lessonSlug)),
  ]);

  return {
    likes: likeRows.length,
    liked: userLike.length > 0,
    commentCount: commentRows.length,
  };
}

export async function toggleLessonLike(userId: number, lessonSlug: string) {
  const db = await getDb();
  if (!db) return { liked: false, likes: 0 };

  const existing = await db
    .select()
    .from(lessonLikes)
    .where(and(eq(lessonLikes.lessonSlug, lessonSlug), eq(lessonLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(lessonLikes).where(eq(lessonLikes.id, existing[0].id));
    const likeRows = await db
      .select({ id: lessonLikes.id })
      .from(lessonLikes)
      .where(eq(lessonLikes.lessonSlug, lessonSlug));
    return { liked: false, likes: likeRows.length };
  }

  await db.insert(lessonLikes).values({ lessonSlug, userId });
  const likeRows = await db
    .select({ id: lessonLikes.id })
    .from(lessonLikes)
    .where(eq(lessonLikes.lessonSlug, lessonSlug));
  return { liked: true, likes: likeRows.length };
}

export async function getLessonComments(lessonSlug: string) {
  const db = await getDb();
  if (!db) return [];

  const comments = await db
    .select()
    .from(lessonComments)
    .where(eq(lessonComments.lessonSlug, lessonSlug))
    .orderBy(asc(lessonComments.createdAt));

  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map(c => c.userId))];
  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profileImageUrl: creatorProfiles.profileImageUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(inArray(users.id, userIds));
  const authorMap = new Map(authors.map(a => [a.id, a]));

  return comments.map(c => {
    const author = authorMap.get(c.userId);
    return {
      id: c.id,
      lessonSlug: c.lessonSlug,
      userId: c.userId,
      parentCommentId: c.parentCommentId ?? null,
      content: c.content,
      createdAt: c.createdAt,
      authorName: author?.name || author?.username || "Creator",
      authorUsername: author?.username ?? null,
      authorProfileImageUrl: author?.profileImageUrl ?? null,
    };
  });
}

export async function createLessonComment(
  userId: number,
  lessonSlug: string,
  content: string,
  parentCommentId?: number
) {
  const db = await getDb();
  if (!db) return null;

  if (parentCommentId) {
    const parent = await db
      .select()
      .from(lessonComments)
      .where(eq(lessonComments.id, parentCommentId))
      .limit(1);
    if (parent.length === 0 || parent[0].lessonSlug !== lessonSlug) return null;
  }

  const rows = await db
    .insert(lessonComments)
    .values({ lessonSlug, userId, content, parentCommentId: parentCommentId ?? null })
    .returning({ id: lessonComments.id });

  return rows[0]?.id ?? null;
}

export type LearningLessonRow = {
  id: number;
  slug: string;
  lessonLabel: string | null;
  title: string;
  durationSeconds: number | null;
  youtubeVideoId: string | null;
  sectionId: number;
  sectionTitle: string;
  sectionSlug: string;
  trackSlug: string;
  trackTitle: string;
  trackEmoji: string | null;
};

export type LearningTrackPayload = {
  slug: string;
  title: string;
  emoji: string | null;
  welcomeEnabled: boolean;
  sections: Array<{
    id: number;
    slug: string;
    title: string;
    lessons: Array<{
      id: number;
      slug: string;
      lessonLabel: string | null;
      title: string;
      durationSeconds: number | null;
      youtubeVideoId: string | null;
    }>;
  }>;
};

export async function learningLessonExists(lessonSlug: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: learningLessons.id })
    .from(learningLessons)
    .where(eq(learningLessons.slug, lessonSlug))
    .limit(1);
  return rows.length > 0;
}

export async function getLearningTrack(trackSlug: string): Promise<LearningTrackPayload | null> {
  const db = await getDb();
  if (!db) return null;

  const tracks = await db.select().from(learningTracks).where(eq(learningTracks.slug, trackSlug)).limit(1);
  const track = tracks[0];
  if (!track) return null;

  const sections = await db
    .select()
    .from(learningSections)
    .where(eq(learningSections.trackSlug, trackSlug))
    .orderBy(asc(learningSections.sortOrder));

  const sectionIds = sections.map(s => s.id);
  const lessons =
    sectionIds.length === 0
      ? []
      : await db
          .select()
          .from(learningLessons)
          .where(inArray(learningLessons.sectionId, sectionIds))
          .orderBy(asc(learningLessons.sortOrder));

  const lessonsBySection = new Map<number, typeof lessons>();
  for (const lesson of lessons) {
    const arr = lessonsBySection.get(lesson.sectionId) ?? [];
    arr.push(lesson);
    lessonsBySection.set(lesson.sectionId, arr);
  }

  return {
    slug: track.slug,
    title: track.title,
    emoji: track.emoji,
    welcomeEnabled: track.welcomeEnabled,
    sections: sections.map(section => ({
      id: section.id,
      slug: section.slug,
      title: section.title,
      lessons: (lessonsBySection.get(section.id) ?? []).map(lesson => ({
        id: lesson.id,
        slug: lesson.slug,
        lessonLabel: lesson.lessonLabel,
        title: lesson.title,
        durationSeconds: lesson.durationSeconds,
        youtubeVideoId: lesson.youtubeVideoId,
      })),
    })),
  };
}

export async function getLearningLesson(lessonSlug: string): Promise<LearningLessonRow | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select({
      id: learningLessons.id,
      slug: learningLessons.slug,
      lessonLabel: learningLessons.lessonLabel,
      title: learningLessons.title,
      durationSeconds: learningLessons.durationSeconds,
      youtubeVideoId: learningLessons.youtubeVideoId,
      sectionId: learningSections.id,
      sectionTitle: learningSections.title,
      sectionSlug: learningSections.slug,
      trackSlug: learningTracks.slug,
      trackTitle: learningTracks.title,
      trackEmoji: learningTracks.emoji,
    })
    .from(learningLessons)
    .innerJoin(learningSections, eq(learningSections.id, learningLessons.sectionId))
    .innerJoin(learningTracks, eq(learningTracks.slug, learningSections.trackSlug))
    .where(eq(learningLessons.slug, lessonSlug))
    .limit(1);

  return rows[0] ?? null;
}

async function getAnnouncementById(announcementId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(announcements).where(eq(announcements.id, announcementId)).limit(1);
  return rows[0];
}

export async function getAnnouncementsFeed(
  viewerUserId: number,
  limit = 50,
  offset = 0,
  channel = "avisos"
) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select()
    .from(announcements)
    .where(eq(announcements.channel, channel))
    .orderBy(desc(announcements.createdAt))
    .limit(limit)
    .offset(offset);

  if (items.length === 0) return [];

  const ids = items.map(a => a.id);
  const authorIds = [...new Set(items.map(a => a.userId))];

  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      profileImageUrl: creatorProfiles.profileImageUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(inArray(users.id, authorIds));
  const authorMap = new Map(authors.map(a => [a.id, a]));

  const commentCounts = await db
    .select({
      announcementId: announcementComments.announcementId,
      count: sql<number>`count(*)::int`,
    })
    .from(announcementComments)
    .where(inArray(announcementComments.announcementId, ids))
    .groupBy(announcementComments.announcementId);
  const countMap = new Map(commentCounts.map(c => [c.announcementId, c.count]));

  const viewerLikes = await db
    .select({ announcementId: announcementLikes.announcementId })
    .from(announcementLikes)
    .where(and(eq(announcementLikes.userId, viewerUserId), inArray(announcementLikes.announcementId, ids)));
  const likedSet = new Set(viewerLikes.map(l => l.announcementId));

  return items.map(item => {
    const author = authorMap.get(item.userId);
    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl,
      attachmentUrl: item.attachmentUrl,
      attachmentName: item.attachmentName,
      likes: item.likes,
      commentCount: countMap.get(item.id) ?? 0,
      liked: likedSet.has(item.id),
      createdAt: item.createdAt,
      authorName: author?.name || author?.username || "Equipe",
      authorUsername: author?.username ?? null,
      authorProfileImageUrl: author?.profileImageUrl ?? null,
      authorRole: author?.role ?? "user",
      authorMemberSince: author?.createdAt ?? item.createdAt,
    };
  });
}

export async function createAnnouncement(
  userId: number,
  data: {
    title: string;
    content: string;
    channel?: string;
    imageUrl?: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }
) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const [row] = await db
    .insert(announcements)
    .values({
      userId,
      channel: data.channel ?? "avisos",
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      attachmentUrl: data.attachmentUrl ?? null,
      attachmentName: data.attachmentName ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: announcements.id });
  return row?.id ?? null;
}

export async function toggleAnnouncementLike(userId: number, announcementId: number) {
  const db = await getDb();
  if (!db) return { liked: false, likes: 0 };
  const item = await getAnnouncementById(announcementId);
  if (!item) return { liked: false, likes: 0 };

  const existing = await db
    .select()
    .from(announcementLikes)
    .where(and(eq(announcementLikes.announcementId, announcementId), eq(announcementLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(announcementLikes).where(eq(announcementLikes.id, existing[0].id));
    const newCount = Math.max(0, item.likes - 1);
    await db.update(announcements).set({ likes: newCount, updatedAt: new Date() }).where(eq(announcements.id, announcementId));
    return { liked: false, likes: newCount };
  }

  await db.insert(announcementLikes).values({ announcementId, userId });
  const newCount = item.likes + 1;
  await db.update(announcements).set({ likes: newCount, updatedAt: new Date() }).where(eq(announcements.id, announcementId));
  return { liked: true, likes: newCount };
}

export async function getAnnouncementComments(announcementId: number) {
  const db = await getDb();
  if (!db) return [];

  const comments = await db
    .select()
    .from(announcementComments)
    .where(eq(announcementComments.announcementId, announcementId))
    .orderBy(asc(announcementComments.createdAt));

  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map(c => c.userId))];
  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profileImageUrl: creatorProfiles.profileImageUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(inArray(users.id, userIds));
  const authorMap = new Map(authors.map(a => [a.id, a]));

  return comments.map(c => {
    const author = authorMap.get(c.userId);
    return {
      id: c.id,
      announcementId: c.announcementId,
      userId: c.userId,
      parentCommentId: c.parentCommentId ?? null,
      content: c.content,
      createdAt: c.createdAt,
      authorName: author?.name || author?.username || "Creator",
      authorUsername: author?.username ?? null,
      authorProfileImageUrl: author?.profileImageUrl ?? null,
    };
  });
}

export async function createAnnouncementComment(
  userId: number,
  announcementId: number,
  content: string,
  parentCommentId?: number
) {
  const db = await getDb();
  if (!db) return null;
  const item = await getAnnouncementById(announcementId);
  if (!item) return null;

  if (parentCommentId) {
    const parent = await db
      .select()
      .from(announcementComments)
      .where(eq(announcementComments.id, parentCommentId))
      .limit(1);
    if (parent.length === 0 || parent[0].announcementId !== announcementId) return null;
  }

  const rows = await db
    .insert(announcementComments)
    .values({ announcementId, userId, content, parentCommentId: parentCommentId ?? null })
    .returning({ id: announcementComments.id });
  return rows[0]?.id ?? null;
}

export type TrainingEventItem = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  eventType: string;
  hostName: string | null;
  startDate: Date;
  endDate: Date | null;
  liveStreamUrl: string | null;
  participantCount: number;
  registered: boolean;
};

export async function getTrainingEvents(
  userId: number,
  options: { upcomingOnly?: boolean; category?: string } = {}
): Promise<TrainingEventItem[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const events = await db.select().from(trainingEvents).orderBy(asc(trainingEvents.startDate));
  let filtered = events;

  if (options.upcomingOnly) {
    filtered = filtered.filter(e => e.startDate >= now || (e.endDate && e.endDate >= now));
  }

  if (options.category && options.category !== "all") {
    filtered = filtered.filter(e => e.category === options.category);
  }

  if (filtered.length === 0) return [];

  const eventIds = filtered.map(e => e.id);
  const regCounts = await db
    .select({
      eventId: trainingEventRegistrations.eventId,
      count: sql<number>`count(*)::int`,
    })
    .from(trainingEventRegistrations)
    .where(inArray(trainingEventRegistrations.eventId, eventIds))
    .groupBy(trainingEventRegistrations.eventId);
  const countMap = new Map(regCounts.map(r => [r.eventId, r.count]));

  const userRegs = await db
    .select({ eventId: trainingEventRegistrations.eventId })
    .from(trainingEventRegistrations)
    .where(and(eq(trainingEventRegistrations.userId, userId), inArray(trainingEventRegistrations.eventId, eventIds)));
  const registeredSet = new Set(userRegs.map(r => r.eventId));

  return filtered.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    imageUrl: event.imageUrl,
    category: event.category,
    eventType: event.eventType,
    hostName: event.hostName,
    startDate: event.startDate,
    endDate: event.endDate,
    liveStreamUrl: event.liveStreamUrl,
    participantCount: (countMap.get(event.id) ?? 0) + (event.seedParticipants ?? 0),
    registered: registeredSet.has(event.id),
  }));
}

export async function toggleTrainingRegistration(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return { registered: false };

  const event = await db.select().from(trainingEvents).where(eq(trainingEvents.id, eventId)).limit(1);
  if (event.length === 0) return { registered: false };

  const existing = await db
    .select()
    .from(trainingEventRegistrations)
    .where(and(eq(trainingEventRegistrations.eventId, eventId), eq(trainingEventRegistrations.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(trainingEventRegistrations).where(eq(trainingEventRegistrations.id, existing[0].id));
    return { registered: false };
  }

  await db.insert(trainingEventRegistrations).values({ eventId, userId });
  return { registered: true };
}

export async function getGroupMembers(viewerUserId: number) {
  const db = await getDb();
  if (!db) return { members: [], onlineCount: 0, totalCount: 0 };

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
      profileImageUrl: creatorProfiles.profileImageUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .orderBy(desc(users.lastSignedIn))
    .limit(200);

  const members = rows.map(row => ({
    id: row.id,
    name: row.name || row.username || "Creator",
    username: row.username,
    role: row.role,
    profileImageUrl: row.profileImageUrl,
    isOnline: isUserOnline(row.lastSignedIn),
    isSelf: row.id === viewerUserId,
  }));

  const onlineCount = members.filter(m => m.isOnline).length;
  return { members, onlineCount, totalCount: members.length };
}
