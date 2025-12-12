/* eslint-disable no-console */
/**
 * Standalone script to generate an API key
 * Run with: npx tsx scripts/generate-api-key.ts
 */

import { createHash, randomBytes } from 'crypto';

const API_KEY_PREFIX = 'flock_sk_';

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomString = randomBytes(32).toString('hex');
  const key = `${API_KEY_PREFIX}${randomString}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 16); // "flock_sk_" + 7 chars
  
  return { key, hash, prefix };
}

const { key, hash, prefix } = generateApiKey();

console.log('\n🔑 API Key Generated\n');
console.log('Full Key (save this - shown once!):');
console.log(`  ${key}\n`);
console.log('Hash (store in database):');
console.log(`  ${hash}\n`);
console.log('Prefix (for identification):');
console.log(`  ${prefix}\n`);
console.log('---');
console.log('SQL to insert this key:\n');
console.log(`INSERT INTO api_keys (customer_id, key_hash, key_prefix, name, scopes)
VALUES (
  'YOUR_CUSTOMER_UUID_HERE',
  '${hash}',
  '${prefix}',
  'Production Key',
  ARRAY['read:aggregates', 'read:trends']
);`);
console.log('');
