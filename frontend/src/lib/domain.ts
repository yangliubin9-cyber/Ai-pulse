/**
 * Display host for a link: the URL's hostname minus a leading "www.".
 * Used to show link-only feed items as an intentional "链接 · github.com" card
 * instead of a bare external link. Returns null for empty / unparseable input.
 */
export function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host || null;
  } catch {
    return null;
  }
}
