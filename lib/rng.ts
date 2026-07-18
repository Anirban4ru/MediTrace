// Deterministic mock-RNG and address/tx generators so the simulation
// is reproducible across reloads (no hydration mismatch) yet looks live.

const HEX = '0123456789abcdef';

/** Mulberry32 — tiny deterministic PRNG. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashFromRng(rand: () => number, len = 64): string {
  let out = '0x';
  for (let i = 0; i < len; i++) out += HEX[Math.floor(rand() * 16)];
  return out;
}

export function addressFromRng(rand: () => number): string {
  return hashFromRng(rand, 40);
}

export function blockFromRng(rand: () => number): number {
  return 4_000_000 + Math.floor(rand() * 5_000_000);
}

export function shortHash(h: string, head = 6, tail = 4): string {
  if (h.length <= head + tail + 2) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function shortAddr(a: string): string {
  return shortHash(a, 6, 4);
}
