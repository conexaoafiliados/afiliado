export function formatLessonDuration(seconds?: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function parseYouTubeVideoId(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const parts = url.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export function getTrackStats(sections: { lessons: { durationSeconds?: number | null }[] }[]) {
  const sectionCount = sections.length;
  const lessons = sections.flatMap(s => s.lessons);
  const lessonCount = lessons.length;
  const totalSeconds = lessons.reduce((acc, l) => acc + (l.durationSeconds ?? 0), 0);
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  return { sectionCount, lessonCount, totalMinutes, totalSeconds };
}
