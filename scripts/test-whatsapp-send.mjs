/**
 * Send ONE real WhatsApp message through Evolution Go, outside the payment
 * flow entirely — a standalone way to confirm the `/send/text` contract
 * (and, in particular, the phone-number wire format) before trusting it
 * inside `src/lib/whatsapp/notify.ts`.
 *
 * This does NOT exercise `claimWhatsappSend`, the database, or any
 * idempotency guarantee — it is a direct, one-shot call to Evolution Go, for
 * verifying Evolution Go itself. Never point this at a real lead's number.
 *
 *   node scripts/test-whatsapp-send.mjs 9188xxxxxxx
 *   node scripts/test-whatsapp-send.mjs 9188xxxxxxx "custom test message"
 *
 * The number must be typed out in full, digits only, country code included
 * (e.g. 91 then 10 digits for India) — there is no default and no fallback to
 * any stored lead, on purpose.
 */

import { readFileSync } from "node:fs";

const ENV_FILE = ".env.local";

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

const env = readEnv();
const baseUrl = (process.env.EVOLUTION_API_URL?.trim() || env.EVOLUTION_API_URL)?.replace(/\/+$/, "");
const apiKey = process.env.EVOLUTION_API_KEY?.trim() || env.EVOLUTION_API_KEY;

if (!baseUrl || !apiKey) {
  console.error(
    "✗ EVOLUTION_API_URL / EVOLUTION_API_KEY are not set.\n\n" +
      "  Add them to .env.local first (see .env.example).",
  );
  process.exit(1);
}

const [, , number, ...rest] = process.argv;

if (!number || !/^\d{10,15}$/.test(number)) {
  console.error(
    "✗ Pass the destination as plain digits, country code included, e.g.:\n\n" +
      "    node scripts/test-whatsapp-send.mjs 9188xxxxxxx\n",
  );
  process.exit(1);
}

const text =
  rest.join(" ").trim() ||
  "This is a test message from the KnowMind Universe registration system. If you received this, Evolution Go is wired up correctly.";

console.log(`About to send a REAL WhatsApp message.\n`);
console.log(`  Evolution Go : ${baseUrl}`);
console.log(`  To           : ${number}`);
console.log(`  Text         : ${JSON.stringify(text)}\n`);

const response = await fetch(`${baseUrl}/send/text`, {
  method: "POST",
  headers: { apikey: apiKey, "Content-Type": "application/json" },
  body: JSON.stringify({ number, text }),
});

const raw = await response.text();
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = raw;
}

console.log(`HTTP ${response.status}\n`);
console.log(JSON.stringify(parsed, null, 2));

if (!response.ok) {
  console.error(
    `\n✗ Evolution Go rejected the request. Common causes:\n` +
      `  - The instance is not connected to WhatsApp (check the manager's QR/connect status)\n` +
      `  - The number format is wrong for this deployment (try with/without a leading 0, or a\n` +
      `    different country-code shape, and compare against what the manager UI itself sends\n` +
      `    when you use its own "Send Message" dialog)\n` +
      `  - EVOLUTION_API_KEY is wrong or has been rotated\n`,
  );
  process.exit(1);
}

console.log(
  `\n✓ Evolution Go accepted the request. Confirm the message actually arrived on ${number}'s` +
    ` WhatsApp — a 2xx here only means Evolution Go accepted it for delivery, not that it landed.`,
);
