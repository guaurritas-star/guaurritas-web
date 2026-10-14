export type CommunityReview = { id: string; name: string; text: string; photo?: string };

export function normalizeReviews(value: unknown): CommunityReview[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.slice(0, 50).flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const { id, name, text, photo } = item;
    if (typeof id !== "string" || typeof name !== "string" || typeof text !== "string" ||
        !id || !name.trim() || !text.trim() || seen.has(id) || text.length > 10000) return [];
    seen.add(id);
    let safePhoto: string | undefined;
    if (typeof photo === "string") {
      try {
        const url = new URL(photo);
        if (url.protocol === "https:" && url.hostname === "static.wixstatic.com" && url.pathname.startsWith("/media/")) {
          safePhoto = url.href;
        }
      } catch { /* A malformed image does not invalidate the real comment. */ }
    }
    return [{ id, name: name.trim(), text: text.trim(), photo: safePhoto }];
  });
}

export function selectReviews(reviews: CommunityReview[], previousFirst?: string, random = Math.random) {
  const shuffled = [...reviews];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.length > 1 && shuffled[0].id === previousFirst) shuffled.push(shuffled.shift()!);
  return shuffled.slice(0, 5);
}
