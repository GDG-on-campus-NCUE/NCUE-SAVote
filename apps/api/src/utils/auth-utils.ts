/**
 * Normalizes the Synology Sub (UID) by removing the domain prefix if present.
 * Example: "NCUESA\\S1354032" -> "S1354032"
 */
export function normalizeSub(sub: string): string {
  if (!sub) return sub;
  
  // If the sub contains a backslash, take the part after the last backslash
  if (sub.includes('\\')) {
    const parts = sub.split('\\');
    return parts[parts.length - 1];
  }
  
  return sub;
}
