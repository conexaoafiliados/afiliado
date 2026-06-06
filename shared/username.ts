/** Usernames no estilo @tiktok / @instagram: letras, números, ponto e underscore */
export const USERNAME_REGEX = /^[a-z0-9._]+$/;
export const USERNAME_INPUT_REGEX = /^[a-zA-Z0-9._]+$/;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export const USERNAME_HINT =
  "Letras, números, ponto (.) ou _. Ex: karen.scarpelli ou seu_usuario";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, "");
}

export function isValidUsername(raw: string): boolean {
  const u = normalizeUsername(raw);
  return u.length >= USERNAME_MIN && u.length <= USERNAME_MAX && USERNAME_REGEX.test(u);
}

/** Regex para detectar @menções no texto */
export const MENTION_USERNAME_PATTERN = "[a-zA-Z0-9._]";
export const MENTION_REGEX = new RegExp(`@(${MENTION_USERNAME_PATTERN}{3,30})`, "g");
export const MENTION_PARTIAL_REGEX = new RegExp(`@(${MENTION_USERNAME_PATTERN}*)$`);
export const MENTION_SPLIT_REGEX = new RegExp(`(@${MENTION_USERNAME_PATTERN}+)`, "g");
