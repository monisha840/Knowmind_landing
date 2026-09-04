/**
 * Generate the admin password hash and session secret.
 *
 *   npm run admin:password
 *
 * ---------------------------------------------------------------------------
 * What this protects against
 * ---------------------------------------------------------------------------
 * The password must never end up in source, in a commit, in a terminal
 * transcript, or in shell history. So it is never taken as a command-line
 * argument (argv is visible in `ps` and lands in `.bash_history`), never
 * echoed as you type it, and never printed back.
 *
 * What is written is the scrypt hash — appended to `.env.local`, following the
 * same convention as `scripts/create-webhook.mjs`, which writes the webhook
 * secret to a file rather than to your scrollback.
 *
 * The hash format is read by `src/lib/admin/auth.ts` and by nothing else:
 *
 *   scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>
 *
 * Keep the two files in step if you ever change the parameters. The format is
 * self-describing, so raising N later does not invalidate an existing hash.
 */

import { appendFileSync, readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";

const ENV_FILE = ".env.local";

/* Must match src/lib/admin/auth.ts. */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 32;

const PRINT_ONLY = process.argv.includes("--print");

/* --------------------------------------------------------------- reading -- */

function readEnv() {
  try {
    const raw = readFileSync(ENV_FILE, "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

/* Control codes, by number rather than by escape, so the intent is unambiguous. */
const CR = 13;
const LF = 10;
const CTRL_C = 3;
const CTRL_D = 4;
const BACKSPACE = 8;
const DELETE = 127;
const FIRST_PRINTABLE = 32;

/**
 * Read a line from the terminal without echoing it.
 *
 * Raw mode, one character at a time, printing nothing. Backspace is handled
 * because a password prompt that cannot be corrected is a password prompt
 * people abandon in favour of pasting the password into a command.
 */
function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new Error(
          "This needs an interactive terminal so the password is never echoed.\n" +
            "  Run it directly — not piped, and not through anything that captures stdin.\n" +
            "  On Windows, Git Bash may need:  winpty npm run admin:password",
        ),
      );
      return;
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let value = "";

    const onData = (chunk) => {
      for (const char of chunk) {
        const code = char.charCodeAt(0);

        if (code === CR || code === LF) {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }

        if (code === CTRL_C || code === CTRL_D) {
          process.stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
          return;
        }

        if (code === BACKSPACE || code === DELETE) {
          value = value.slice(0, -1);
          continue;
        }

        /* Anything else printable. Other control codes are dropped rather than
           stored, so a stray arrow key never becomes part of the password. */
        if (code >= FIRST_PRINTABLE) value += char;
      }
    };

    process.stdin.on("data", onData);
  });
}

/* ---------------------------------------------------------------- hashing -- */

function hash(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: 256 * N * R,
  });
  return ["scrypt", N, R, P, salt.toString("base64"), derived.toString("base64")].join("$");
}

/* ------------------------------------------------------------------ main -- */

const env = readEnv();

if (env.ADMIN_PASSWORD_HASH && !PRINT_ONLY) {
  console.error(
    `✗ ADMIN_PASSWORD_HASH already has a value in ${ENV_FILE}.\n` +
      "  Delete that line first if you want to set a new password,\n" +
      "  or run with --print to generate one without writing the file.",
  );
  process.exit(1);
}

let password;
try {
  password = await readHidden("New admin password (not shown): ");
  const again = await readHidden("Repeat it: ");

  if (password !== again) {
    console.error("✗ Those did not match. Nothing was written.");
    process.exit(1);
  }
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    "✗ Use at least 12 characters. This is the only thing standing between\n" +
      "  the internet and every registrant's name, email and phone number.",
  );
  process.exit(1);
}

const passwordHash = hash(password);
// Not needed again; do not leave it sitting in memory for the rest of the run.
password = null;

const sessionSecret = env.ADMIN_SESSION_SECRET || randomBytes(32).toString("hex");

if (PRINT_ONLY) {
  console.log("\n# Paste into .env.local, and set the same values in Vercel:\n");
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  if (!env.ADMIN_SESSION_SECRET) console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
  process.exit(0);
}

const lines = [
  "",
  "# --- Admin dashboard ------------------------------------------------------",
  "# Written by `npm run admin:password`. The password itself was never stored,",
  "# printed or logged — only this scrypt hash of it, which is what",
  "# src/lib/admin/auth.ts verifies against.",
  `ADMIN_PASSWORD_HASH=${passwordHash}`,
];

if (!env.ADMIN_SESSION_SECRET) {
  lines.push(
    "# Signs the admin session cookie. Rotating this value logs everyone out,",
    "# which is the revocation mechanism for a design with no session table.",
    `ADMIN_SESSION_SECRET=${sessionSecret}`,
  );
}

appendFileSync(ENV_FILE, `${lines.join("\n")}\n`, "utf8");

console.log(`\n✓ Written to ${ENV_FILE}. The password itself was not stored anywhere.`);
console.log("\nNext, set the same two values on Vercel. This prompts for each value");
console.log("without echoing it, so nothing reaches your shell history:\n");
console.log("  vercel env add ADMIN_PASSWORD_HASH production");
console.log("  vercel env add ADMIN_SESSION_SECRET production");
console.log(`\nBoth values are in ${ENV_FILE} if you need to copy them.`);
