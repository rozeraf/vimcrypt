const VIM_CHARS = ["h", "j", "k", "l", "i", "a", "I", "A", "e", "x"];
const CHAR_TO_VAL: Record<string, number> = Object.fromEntries(
  VIM_CHARS.map((c, i) => [c, i]),
);

function byteToVim(b: number): string {
  const d0 = Math.floor(b / 100);
  const d1 = Math.floor((b % 100) / 10);
  const d2 = b % 10;
  return VIM_CHARS[d0] + VIM_CHARS[d1] + VIM_CHARS[d2];
}

function vimToByte(s: string): number {
  const d0 = CHAR_TO_VAL[s[0]];
  const d1 = CHAR_TO_VAL[s[1]];
  const d2 = CHAR_TO_VAL[s[2]];
  if (d0 === undefined || d1 === undefined || d2 === undefined) {
    throw new Error(`Invalid vim token: "${s}"`);
  }
  return d0 * 100 + d1 * 10 + d2;
}

function bytesToVim(bytes: Uint8Array): string {
  return Array.from(bytes).map(byteToVim).join("");
}

function vimToBytes(s: string): Uint8Array {
  if (s.length % 3 !== 0) throw new Error("Invalid vim string length");
  const result = new Uint8Array(s.length / 3);
  for (let i = 0; i < s.length; i += 3) {
    result[i / 3] = vimToByte(s.slice(i, i + 3));
  }
  return result;
}

async function deriveKey(
  password: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(text: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt.buffer as ArrayBuffer);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(text),
  );

  const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);
  return bytesToVim(combined);
}

export async function decrypt(
  vimText: string,
  password: string,
): Promise<string> {
  const combined = vimToBytes(vimText);
  const salt = combined.buffer.slice(0, 16) as ArrayBuffer;
  const iv = combined.buffer.slice(16, 28) as ArrayBuffer;
  const ciphertext = combined.buffer.slice(28) as ArrayBuffer;

  const key = await deriveKey(password, salt);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
  } catch {
    throw new Error("Decryption failed: wrong password or corrupted data");
  }

  return new TextDecoder().decode(plaintext);
}
