import { encrypt, decrypt } from "./vimcrypt";

const [, , command, input, password] = process.argv;

if (!command || !input || !password) {
  console.error("Usage:");
  console.error("  vimcrypt encrypt <text> <password>");
  console.error("  vimcrypt decrypt <cipher> <password>");
  process.exit(1);
}

if (command === "encrypt") {
  console.log(await encrypt(input, password));
} else if (command === "decrypt") {
  try {
    console.log(await decrypt(input, password));
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
