/**
 * Tags are stored on `metadata.tags` by both the transaction wizard and the
 * Other Ledger entry editor. Data written by older builds (or by hand) can be
 * missing, non-array, or contain empty values, so reads stay defensive.
 */
export function transactionTags(source: { metadata?: Record<string, unknown> }): string[] {
  const raw = source.metadata?.tags;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    .map((tag) => tag.trim());
}
