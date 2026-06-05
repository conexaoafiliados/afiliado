const MENTION_RE = /@([a-zA-Z0-9_]{3,30})/g;

export function extractMentionUsernames(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(MENTION_RE)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}
