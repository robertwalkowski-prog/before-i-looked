import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (at: string, job: string, status: string, owner: string | null) =>
  JSON.stringify({ at, job, status, owner });

// Jobs are written out of order on purpose: both routes must sort by job.
const NORMAL = [
  line('2026-10-28T02:00:00+01:00', 'zulu-export', 'ok', 'ann'),
  line('2026-10-28T02:05:00+01:00', 'alpha-sync', 'retry', 'bob'),
  line('2026-10-28T02:10:00+01:00', 'alpha-sync', 'ok', 'bob'),
  line('2026-10-28T02:15:00+01:00', 'mike-mail', 'fail', null),
].join('\n') + '\n';
const JOBS_SORTED = ['alpha-sync', 'mike-mail', 'zulu-export'];

const BAD = [
  line('2026-10-27T03:00:00+01:00', 'delta-report', 'ok', 'ann'),
  'this is not json',
  line('2026-10-27T03:30:00+01:00', 'bravo-backup', 'ok', null),
].join('\n') + '\n';

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(join(dir, '2026-10-28.jsonl'), NORMAL);
  writeFileSync(join(dir, '2026-10-26.jsonl'), '');
  writeFileSync(join(dir, '2026-10-27.jsonl'), BAD);
  app = createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir: dir,
  });
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

type ApiNight = { night: string; rows: { job: string }[]; badLines: number };

function orderOf(html: string, jobs: string[]): number[] {
  return jobs.map((j) => html.indexOf(j));
}

describe('GET /digest/:night', () => {
  it('renders a normal night with the lane banner and its jobs', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const res = await app.request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    expect(html).toContain('<table');
    for (const job of JOBS_SORTED) expect(html).toContain(job);
  });

  it('returns 404 for a night with no file', async () => {
    const res = await app.request('/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('renders "nothing ran" for an empty file', async () => {
    const res = await app.request('/digest/2026-10-26');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('renders a night with a bad line: 200, its jobs, and the bad line count', async () => {
    const res = await app.request('/digest/2026-10-27');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('bravo-backup');
    expect(html).toContain('delta-report');
    expect(html).toContain('bad lines: 1');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns night, rows sorted by job, and badLines', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiNight;
    expect(body.night).toBe('2026-10-28');
    expect(body.badLines).toBe(0);
    expect(body.rows.map((r) => r.job)).toEqual(JOBS_SORTED);
  });

  it('returns 404 for a night with no file', async () => {
    const res = await app.request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('returns 200 with no rows for an empty night', async () => {
    const res = await app.request('/api/digest/2026-10-26');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiNight;
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('counts bad lines and still returns the good rows', async () => {
    const res = await app.request('/api/digest/2026-10-27');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiNight;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['bravo-backup', 'delta-report']);
  });
});

describe('page and JSON agree', () => {
  it.each(['2026-10-28', '2026-10-27'])('same jobs in the same order for %s', async (night) => {
    const api = (await (await app.request(`/api/digest/${night}`)).json()) as ApiNight;
    const html = await (await app.request(`/digest/${night}`)).text();
    const jobs = api.rows.map((r) => r.job);
    expect(jobs.length).toBeGreaterThan(0);
    const positions = orderOf(html, jobs);
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
