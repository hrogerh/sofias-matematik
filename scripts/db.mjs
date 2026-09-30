#!/usr/bin/env node
// Litet verktyg för att läsa/skriva direkt i Upstash Redis-databasen.
// Läser UPSTASH_REDIS_REST_URL/TOKEN (eller KV_REST_API_URL/TOKEN) från
// en .env.local i projektroten – den filen committas aldrig.
//
// Användning:
//   node scripts/db.mjs get <key>
//   node scripts/db.mjs set <key> <json-fil>

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Hittar ingen .env.local i projektroten (kör skriptet från repo-roten).');
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv();
const BASE = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

if (!BASE || !TOKEN) {
  console.error('Saknar UPSTASH_REDIS_REST_URL/TOKEN (eller KV_REST_API_URL/TOKEN) i .env.local');
  process.exit(1);
}

async function redisGet(key) {
  const r = await fetch(`${BASE}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await r.json();
  return data.result;
}

async function redisSet(key, rawValue) {
  const r = await fetch(`${BASE}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: rawValue
  });
  return r.json();
}

async function redisDel(key) {
  const r = await fetch(`${BASE}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  return r.json();
}

const [cmd, key, arg] = process.argv.slice(2);

if (cmd === 'get' && key) {
  const raw = await redisGet(key);
  if (raw === null || raw === undefined) {
    console.log('(finns inte)');
  } else {
    try {
      console.log(JSON.stringify(JSON.parse(raw), null, 2));
    } catch {
      console.log(raw);
    }
  }
} else if (cmd === 'set' && key && arg) {
  const raw = fs.readFileSync(arg, 'utf8');
  JSON.parse(raw); // validera innan vi skriver något
  const result = await redisSet(key, raw);
  console.log(result);
} else if (cmd === 'del' && key) {
  const result = await redisDel(key);
  console.log(result);
} else {
  console.log('Använd:');
  console.log('  node scripts/db.mjs get <key>');
  console.log('  node scripts/db.mjs set <key> <json-fil>');
  console.log('  node scripts/db.mjs del <key>');
  process.exit(1);
}
