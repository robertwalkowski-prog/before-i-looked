import { describe, expect, it } from 'vitest';
import { digest, readNight } from '../src/digest/reader.js';

describe('digest reader', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n).not.toBeNull();
    expect(n!.badLines).toBe(1);
    expect(n!.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const refresh = n!.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(refresh).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(refresh.firstAt).toBe('2026-10-29T01:30:00+01:00');
    const backup = n!.rows.find((r) => r.job === 'notes/backup')!;
    expect(backup).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded', owner: 'lane-07' });
    expect(n!.rows.find((r) => r.job === 'digest/render')!.owner).toBeNull();
  });

  it('returns null for a night with no file or a bad night name', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });

  it('an empty night has no rows', () => {
    expect(digest('2026-10-30', '')).toEqual({ night: '2026-10-30', rows: [], badLines: 0 });
  });

  it('counts lines that are JSON but not run lines as bad', () => {
    const n = digest('x', '{"at":"t","job":"a","status":"weird","owner":null}\n[1]\nnull\n');
    expect(n.badLines).toBe(3);
    expect(n.rows).toEqual([]);
  });
});
