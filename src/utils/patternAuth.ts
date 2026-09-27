/**
 * Pattern Authentication Utilities (Web Crypto & Client-Side Verification)
 */

export async function hashPattern(pattern: number[], salt = 'budgetflow_family'): Promise<string> {
  const patternString = `${salt}:${pattern.join('-')}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(patternString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple hash for older environments
  let hash = 0;
  for (let i = 0; i < patternString.length; i++) {
    const char = patternString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function comparePatterns(p1: number[], p2: number[]): boolean {
  if (p1.length !== p2.length) return false;
  return p1.every((val, idx) => val === p2[idx]);
}
