/**
 * Normalizes the Synology Sub (UID) by removing the domain prefix if present.
 * Example: "NCUESA\\S1354032" -> "S1354032"
 * Example: "NCUESA/S1354032" -> "S1354032"
 */
export function normalizeSub(sub: string): string {
  if (!sub) return sub;
  
  // Split by either \ or /
  const parts = sub.split(/[\\\/]/);
  return parts[parts.length - 1];
}
