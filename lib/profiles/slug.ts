const RESERVED = new Set(["admin", "join", "api", "login", "p"]);

const SLUG_RE = /^[a-z0-9-]{3,32}$/;

export function normalizeSlugInput(input: string): string {
  return input.trim().toLowerCase();
}

export function validateSlug(slug: string): string | null {
  const normalized = normalizeSlugInput(slug);
  if (!SLUG_RE.test(normalized)) {
    return "Slug must be 3–32 characters: lowercase letters, numbers, and hyphens only.";
  }
  if (RESERVED.has(normalized)) {
    return "That slug is reserved.";
  }
  return null;
}
