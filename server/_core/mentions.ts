import { MENTION_REGEX } from "../../shared/username";

export function extractMentionUsernames(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(MENTION_REGEX)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}
