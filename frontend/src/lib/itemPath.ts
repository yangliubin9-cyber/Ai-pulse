/** Single source of truth for the in-site item detail route. */

/** Path to a single item's in-site detail page, with the id URL-encoded. */
export function itemPath(id: string): string {
  return `/item/${encodeURIComponent(id)}`;
}
