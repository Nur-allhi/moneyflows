/**
 * Digest helper for storage integrity checks.
 *
 * - Preferred: real SHA-256 via crypto.subtle (secure contexts).
 * - Fallback (insecure origins like LAN http): a deterministic 2-lane FNV-1a
 *   fingerprint prefixed with `f:`. It detects accidental corruption — the
 *   failure mode in BUG-7 — but is not collision-resistant; acceptable because
 *   plain-http transport is already outside our threat model (SECURITY.md §1).
 */

export function subtleReady(): boolean {
  return typeof crypto !== 'undefined' && crypto.subtle != null;
}

const FNV_OFFSET_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;

function fnv1a32Lane(bytes: Uint8Array, seedExtra: number): number {
  let hash = (FNV_OFFSET_32 ^ seedExtra) >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i] as number;
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return hash >>> 0;
}

export function fastFingerprint(bytes: Uint8Array): string {
  const hi = fnv1a32Lane(bytes, 0x9e3779b9);
  const lo = fnv1a32Lane(bytes, 0x85ebca6b);
  return `f:${hi.toString(16).padStart(8, '0')}${lo.toString(16).padStart(8, '0')}`;
}

/** Hex digest of raw bytes. Never throws for missing crypto.subtle — degrades gracefully. */
export async function digestHex(bytes: Uint8Array): Promise<string> {
  if (subtleReady()) {
    const buf = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return fastFingerprint(bytes);
}
