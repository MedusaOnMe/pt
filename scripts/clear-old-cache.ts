import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function clearOldCache() {
  console.log('Checking Redis cache...\n');

  // Get all keys
  const keys = await redis.keys('*');
  console.log(`Total keys in Redis: ${keys.length}\n`);

  // Group by prefix
  const groups: Record<string, string[]> = {};
  for (const key of keys) {
    const prefix = key.split(':')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(key);
  }

  console.log('Keys by prefix:');
  for (const [prefix, prefixKeys] of Object.entries(groups)) {
    console.log(`  ${prefix}: ${prefixKeys.length} keys`);
  }

  // Delete ALL keys to refresh with proxied URLs
  if (keys.length === 0) {
    console.log('\nNo cache keys to clear.');
    return;
  }

  console.log(`\nDeleting ${keys.length} cache keys to refresh proxied URLs...`);
  const oldKeys = keys;

  // Delete in batches
  for (let i = 0; i < oldKeys.length; i += 100) {
    const batch = oldKeys.slice(i, i + 100);
    await redis.del(...batch);
  }

  console.log('Done! Old cache cleared.');

  // Show remaining
  const remaining = await redis.keys('*');
  console.log(`\nRemaining keys: ${remaining.length}`);
}

clearOldCache().catch(console.error);
