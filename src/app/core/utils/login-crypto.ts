/**
 * Cifrado híbrido del login (browser Web Crypto).
 * Network verá ek/iv/ct — no email/password en claro.
 */

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

export interface EncryptedLoginBody {
  ek: string;
  iv: string;
  ct: string;
}

export async function encryptLoginCredentials(
  publicKeyPem: string,
  email: string,
  password: string,
): Promise<EncryptedLoginBody> {
  const spki = pemToArrayBuffer(publicKeyPem);
  const rsaKey = await crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );

  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(
    JSON.stringify({ email, password, ts: Date.now() }),
  );
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain);

  const rawAes = await crypto.subtle.exportKey('raw', aesKey);
  const ekBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAes);

  return {
    ek: bytesToBase64(new Uint8Array(ekBuf)),
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ctBuf)),
  };
}
