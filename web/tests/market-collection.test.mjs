import test from 'node:test';
import assert from 'node:assert/strict';
import { collectPublicMarket, collectionSummary, publicMarketCollectionStatus } from '../lib/market-collection.mjs';

test('shared updater fails visibly without durable storage', async()=>{
  let reads=0;
  await assert.rejects(collectPublicMarket({read:()=>{reads++;}},null),/저장소/);
  await assert.rejects(publicMarketCollectionStatus(null),/저장소/);
  assert.equal(reads,0);
});
test('collector readback distinguishes polling time from source time and omits account data',()=>{
  const row=collectionSummary({fetchedAt:'2026-10-21T07:00:00Z',sourceUpdatedAt:'2026-10-21T06:00:00Z',quotes:[{seller:'secret'}],provider:{status:'ready'},storageStatus:'connected'}, {rows:1,newestAt:'2026-10-21T06:00:00Z'});
  assert.equal(row.quoteCount,1);assert.notEqual(row.fetchedAt,row.sourceUpdatedAt);
  assert.equal(JSON.stringify(row).includes('secret'),false);assert.equal(row.history.rows,1);
});
