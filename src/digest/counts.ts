import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLine } from './reader.js';

export type Counts = { ok: number; retry: number; fail: number };

// Counts run lines by status. Bad lines count in none of the three.
export function countText(text: string): Counts {
  const counts: Counts = { ok: 0, retry: 0, fail: 0 };
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (line) counts[line.status]++;
  }
  return counts;
}

export function countNight(runsDir: string, night: string): Counts {
  try {
    return countText(readFileSync(join(runsDir, `${night}.jsonl`), 'utf8'));
  } catch {
    return { ok: 0, retry: 0, fail: 0 };
  }
}
