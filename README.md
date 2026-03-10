# vimcrypt

AES-256-GCM encryption with vim-command encoding. Ciphertext looks like vim keystrokes.

## How it works

- **Encryption**: AES-256-GCM with PBKDF2 key derivation (SHA-256, 200k iterations)
- **Encoding**: each output byte is represented as 3 characters from the vim alphabet (`h j k l i a I A e x`)
- **Per-message randomness**: random 16-byte salt + 12-byte IV embedded in every ciphertext
- **Authentication**: GCM auth tag detects tampering or wrong password

The vim layer is cosmetic - ciphertext looks like vim commands, security comes from AES.

## Install

```bash
bun add vimcrypt
```

## Usage

```ts
import { encrypt, decrypt } from "vimcrypt";

const cipher = await encrypt("hello world", "my password");
// → "hhjIkk...ialkhj" (vim-encoded ciphertext)

const plain = await decrypt(cipher, "my password");
// → "hello world"

// wrong password throws:
await decrypt(cipher, "wrong");
// Error: Decryption failed: wrong password or corrupted data
```

## Output format

```
[salt: 16 bytes = 48 chars][iv: 12 bytes = 36 chars][ciphertext+tag]
```

All sections are vim-encoded. The same plaintext produces different ciphertext on every call.

## Vim alphabet

```
h=0  j=1  k=2  l=3  i=4  a=5  I=6  A=7  e=8  x=9
```

Each byte (0-255) maps to 3 characters: `byte 142 → "1","4","2" → "jai"`

## Security notes

- Key derivation: PBKDF2-SHA256, 200 000 iterations - brute-force of weak passwords is expensive
- AES-256-GCM is authenticated encryption - decryption fails loudly on wrong key or corrupted data
- Uses `crypto.subtle` (Web Crypto API) - available in browsers and Bun/Node natively

## License

MIT
