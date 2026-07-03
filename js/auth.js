// auth.js
// Lösenordet lagras som SHA-256-hash – aldrig i klartext

const HASHES = {
  sofia: '0234a06cbad93c2b54919ab31f6edeb011ef0d4c3aeb0f1a6f5137961bcda9c3'
};

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(pw)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function checkPassword(pw) {
  const hash = await hashPassword(pw);
  if (hash === HASHES.sofia) return 'sofia';
  return null;
}

function requireAuth() {
  const auth = sessionStorage.getItem('sofia_auth');
  if (!auth) window.location.href = '/index.html';
  return auth;
}

function logout() {
  sessionStorage.removeItem('sofia_auth');
  window.location.href = '/index.html';
}
