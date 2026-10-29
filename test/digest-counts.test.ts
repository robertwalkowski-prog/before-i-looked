import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countNight } from '../src/digest/counts.js';

describe('countNight', () => {
  it('counts run lines by status and skips bad lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-counts-'));
    writeFileSync(
      join(dir, '2026-01-01.jsonl'),
      [
        '{"at":"a","job":"j","status":"ok","owner":null}',
        '{"at":"b","job":"j","status":"retry","owner":null}',
        'not json',
        '{"at":"c","job":"j","status":"bogus","owner":null}',
        '',
        '{"at":"d","job":"j","status":"fail","owner":null}',
        '{"at":"e","job":"j","status":"ok","owner":null}',
      ].join('\n'),
    );
    expect(countNight(dir, '2026-01-01')).toEqual({ ok: 2, retry: 1, fail: 1 });
  });

  it('gives zeros for a missing night', () => {
    expect(countNight(tmpdir(), '1999-01-01')).toEqual({ ok: 0, retry: 0, fail: 0 });
  });

  it('counts the real nights', () => {
    expect(countNight('runs', '2026-10-28')).toEqual({ ok: 10, retry: 4, fail: 1 });
  });
});
