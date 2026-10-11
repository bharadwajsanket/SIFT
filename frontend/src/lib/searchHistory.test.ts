import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { 
  recordSearch, 
  getSearchHistory, 
  deleteSearchEntry, 
  clearSearchHistory
} from './searchHistory.ts';

describe('Search History Local-First Store', () => {
  beforeEach(async () => {
    await clearSearchHistory();
  });

  it('adds a submitted search entry correctly', async () => {
    const entry = await recordSearch('privacy metasearch', 'all');
    assert.ok(entry !== null);
    assert.strictEqual(entry.query, 'privacy metasearch');
    assert.strictEqual(entry.id, 'privacy metasearch');
    assert.strictEqual(entry.category, 'all');
    assert.ok(entry.timestamp > 0);

    const list = await getSearchHistory();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].query, 'privacy metasearch');
  });

  it('repeating an existing query updates timestamp and deduplicates entry', async () => {
    const first = await recordSearch('OpenStreetMap', 'maps');
    assert.ok(first !== null);
    const firstTimestamp = first.timestamp;

    // Small delay to ensure timestamp progression
    await new Promise((r) => setTimeout(r, 20));

    // Repeat search with different casing
    const second = await recordSearch('openstreetmap', 'all');
    assert.ok(second !== null);
    assert.strictEqual(second.id, 'openstreetmap');
    assert.strictEqual(second.category, 'all');
    assert.ok(second.timestamp >= firstTimestamp);

    const list = await getSearchHistory();
    // Must remain deduplicated to 1 entry
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, 'openstreetmap');
    assert.strictEqual(list[0].timestamp, second.timestamp);
  });

  it('sorts entries by timestamp (newest-first and oldest-first)', async () => {
    await recordSearch('first query');
    await new Promise((r) => setTimeout(r, 10));
    await recordSearch('second query');
    await new Promise((r) => setTimeout(r, 10));
    await recordSearch('third query');

    // Newest first (default)
    const newest = await getSearchHistory({ sort: 'newest' });
    assert.strictEqual(newest.length, 3);
    assert.strictEqual(newest[0].query, 'third query');
    assert.strictEqual(newest[1].query, 'second query');
    assert.strictEqual(newest[2].query, 'first query');

    // Oldest first
    const oldest = await getSearchHistory({ sort: 'oldest' });
    assert.strictEqual(oldest[0].query, 'first query');
    assert.strictEqual(oldest[1].query, 'second query');
    assert.strictEqual(oldest[2].query, 'third query');
  });

  it('sorts entries alphabetically', async () => {
    await recordSearch('Zebra');
    await recordSearch('Apple');
    await recordSearch('Mango');

    const alpha = await getSearchHistory({ sort: 'alpha' });
    assert.strictEqual(alpha.length, 3);
    assert.strictEqual(alpha[0].query, 'Apple');
    assert.strictEqual(alpha[1].query, 'Mango');
    assert.strictEqual(alpha[2].query, 'Zebra');
  });

  it('filters search history entries by text', async () => {
    await recordSearch('next.js tutorials');
    await recordSearch('react performance');
    await recordSearch('next.js app router');

    const filtered = await getSearchHistory({ filter: 'next.js' });
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.every((e) => e.query.toLowerCase().includes('next.js')));

    const noMatch = await getSearchHistory({ filter: 'nonexistent keyword' });
    assert.strictEqual(noMatch.length, 0);
  });

  it('deletes an individual search entry', async () => {
    await recordSearch('query to keep');
    await recordSearch('query to delete');

    let list = await getSearchHistory();
    assert.strictEqual(list.length, 2);

    await deleteSearchEntry('query to delete');

    list = await getSearchHistory();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].query, 'query to keep');
  });

  it('clears all entries completely', async () => {
    await recordSearch('entry 1');
    await recordSearch('entry 2');
    await recordSearch('entry 3');

    let list = await getSearchHistory();
    assert.strictEqual(list.length, 3);

    await clearSearchHistory();

    list = await getSearchHistory();
    assert.strictEqual(list.length, 0);
  });

  it('handles empty states gracefully', async () => {
    const list = await getSearchHistory();
    assert.deepStrictEqual(list, []);

    const filtered = await getSearchHistory({ filter: 'anything' });
    assert.deepStrictEqual(filtered, []);
  });

  it('ensures calculator-only expressions are NOT recorded as web searches', async () => {
    // Pure arithmetic expressions
    const c1 = await recordSearch('2+2');
    assert.strictEqual(c1, null);

    const c2 = await recordSearch('240 * 18');
    assert.strictEqual(c2, null);

    const c3 = await recordSearch('69^69');
    assert.strictEqual(c3, null);

    const c4 = await recordSearch('25% of 800');
    assert.strictEqual(c4, null);

    const c5 = await recordSearch('(50+30)/2');
    assert.strictEqual(c5, null);

    // History should remain completely empty
    const list = await getSearchHistory();
    assert.strictEqual(list.length, 0);

    // Natural searches containing math words SHOULD be recorded
    const s1 = await recordSearch('what is 2+2');
    assert.ok(s1 !== null);
    assert.strictEqual(s1.query, 'what is 2+2');

    const s2 = await recordSearch('100% Cotton');
    assert.ok(s2 !== null);

    const after = await getSearchHistory();
    assert.strictEqual(after.length, 2);
  });
});
