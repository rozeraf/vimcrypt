import * as p from "@clack/prompts";
import { encrypt, decrypt } from "./vimcrypt";

p.intro("vimcrypt");

const command = await p.select({
  message: "Action",
  options: [
    { value: "encrypt", label: "Encrypt" },
    { value: "decrypt", label: "Decrypt" },
  ],
});

if (p.isCancel(command)) {
  p.cancel("Cancelled");
  process.exit(0);
}

const input = await p.text({
  message: command === "encrypt" ? "Text to encrypt" : "Cipher to decrypt",
  validate: (v) => (!v ? "Required" : undefined),
});

if (p.isCancel(input)) {
  p.cancel("Cancelled");
  process.exit(0);
}

const password = await p.password({
  message: "Password",
  validate: (v) => (!v ? "Required" : undefined),
});

if (p.isCancel(password)) {
  p.cancel("Cancelled");
  process.exit(0);
}

const spinner = p.spinner();
spinner.start(command === "encrypt" ? "Encrypting" : "Decrypting");

try {
  const result =
    command === "encrypt"
      ? await encrypt(input as string, password as string)
      : await decrypt(input as string, password as string);

  spinner.stop("Done");
  p.note(result, "Result");
} catch (e) {
  spinner.stop("Failed");
  p.cancel((e as Error).message);
  process.exit(1);
}
