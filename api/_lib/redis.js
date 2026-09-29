// Delad hjälpfunktion för alla api/*.js – pratar med Upstash Redis REST API.
// Stödjer både Upstash-namngivningen (UPSTASH_REDIS_REST_*) och Vercels
// egen KV-integration (KV_REST_API_*), beroende på hur databasen kopplades in.

const BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  if (!BASE || !TOKEN) throw new Error('Saknar databas-miljövariabler (UPSTASH_REDIS_REST_URL/TOKEN)');
  const r = await fetch(`${BASE}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await r.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function redisSet(key, value) {
  if (!BASE || !TOKEN) throw new Error('Saknar databas-miljövariabler (UPSTASH_REDIS_REST_URL/TOKEN)');
  const r = await fetch(`${BASE}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(value)
  });
  return r.json();
}

module.exports = { redisGet, redisSet };
