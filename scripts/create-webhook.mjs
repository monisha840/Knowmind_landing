/**
 * Create the Razorpay webhook, over the API.
 *
 *   node scripts/create-webhook.mjs
 *
 * Why this exists: the webhook is the only part of the payment flow that
 * Razorpay itself drives, and it is what saves a registration when the
 * browser never makes it back from checkout — a phone that dies on the bank's
 * confirmation screen, an app that kills the tab, a train entering a tunnel.
 * Without it those people pay and are never marked PAID.
 *
 * It reads the API keys from `.env.local`, generates a strong secret, creates
 * the webhook, and appends the secret back to `.env.local`. The secret is
 * never printed to the terminal — it would end up in your shell history.
 *
 * Test mode and live mode are separate universes at Razorpay: a webhook made
 * with test keys does not exist in live mode. Run this again with live keys
 * when you go live, and set the resulting secret in Vercel's Production scope.
 */

import { readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const ENV_FILE = ".env.local";
const EVENTS = ["payment.captured", "payment.failed", "order.paid"];

/* ------------------------------------------------------------------ env -- */

function readEnv() {
  let raw;
  try {
    raw = readFileSync(ENV_FILE, "utf8");
  } catch {
    console.error(`✗ Could not read ${ENV_FILE}. Run this from the project root.`);
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = readEnv();

/**
 * Which origin Razorpay delivers to.
 *
 * A webhook points at one fixed URL, so this has to be the origin the site is
 * actually served from rather than whichever one was true when the script was
 * written. Resolution order: an argument you pass, then NEXT_PUBLIC_SITE_URL
 * from .env.local, then the original default.
 *
 * Pass it explicitly when the programme is on its own subdomain:
 *
 *   npm run webhook:create -- https://1percentagebetter.kaleeswaran.com
 *
 * Getting this wrong is silent: Razorpay accepts the webhook, delivers to a URL
 * that answers 404, and the payments that depended on it are never confirmed
 * out of band.
 */
const rawOrigin =
  process.argv[2] || env.NEXT_PUBLIC_SITE_URL || "https://www.knowminduniverse.com";
const origin = rawOrigin.endsWith("/") ? rawOrigin.slice(0, -1) : rawOrigin;
const WEBHOOK_URL = `${origin}/api/razorpay/webhook`;
const keyId = env.RAZORPAY_KEY_ID;
const keySecret = env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error(`✗ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing from ${ENV_FILE}.`);
  process.exit(1);
}

if (env.RAZORPAY_WEBHOOK_SECRET) {
  console.error(
    `✗ RAZORPAY_WEBHOOK_SECRET already has a value in ${ENV_FILE}.\n` +
      `  A second webhook on the same URL would double every delivery.\n` +
      `  Delete that line first if you genuinely want to start over.`,
  );
  process.exit(1);
}

const mode = keyId.startsWith("rzp_live_") ? "LIVE" : "TEST";
const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

/* ------------------------------------------------------------------ run -- */

console.log(`\n  Razorpay mode : ${mode}`);
console.log(`  Webhook URL   : ${WEBHOOK_URL}`);
console.log(`  Events        : ${EVENTS.join(", ")}\n`);

if (mode === "LIVE") {
  console.log("  ⚠  These are LIVE keys. This webhook will carry real payments.\n");
}

/* Refuse to add a second webhook for the same URL: Razorpay would then deliver
   every event twice. Harmless for correctness — `markPaid` is idempotent — but
   it doubles the traffic and makes the dashboard's delivery log unreadable. */
const existing = await fetch("https://api.razorpay.com/v1/webhooks", { headers })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);

if (existing?.items?.some((w) => w.url === WEBHOOK_URL)) {
  console.error("✗ A webhook for this URL already exists. Nothing to do.");
  console.error("  Its secret is only shown at creation time — if you have lost it,");
  console.error("  delete the webhook in the dashboard and run this again.");
  process.exit(1);
}

// Chosen here, never guessed: 32 URL-safe characters from the system CSPRNG.
const secret = randomBytes(24).toString("base64url");

const response = await fetch("https://api.razorpay.com/v1/webhooks", {
  method: "POST",
  headers,
  body: JSON.stringify({ url: WEBHOOK_URL, secret, events: EVENTS }),
});

const body = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`✗ Razorpay refused the request (HTTP ${response.status}).`);
  console.error(`  ${body?.error?.description ?? "No description returned."}`);
  console.error(
    "\n  If this says the endpoint is unavailable for your account, create the\n" +
      "  webhook by hand instead: Dashboard → Settings → Webhooks → Add New Webhook,\n" +
      "  with the URL and events printed above, then put the secret you choose into\n" +
      `  ${ENV_FILE} as RAZORPAY_WEBHOOK_SECRET=…`,
  );
  process.exit(1);
}

/* The secret is written, not printed. Razorpay shows it once at creation and
   never again, so losing it means deleting the webhook and starting over —
   but a terminal echo would leave it in shell history and scrollback. */
appendFileSync(ENV_FILE, `\nRAZORPAY_WEBHOOK_SECRET=${secret}\n`);

console.log(`✓ Webhook created — id ${body.id}`);
console.log(`✓ Secret written to ${ENV_FILE} as RAZORPAY_WEBHOOK_SECRET (not printed)`);
console.log("\n  Next: push it to the deployment and redeploy —");
console.log("    vercel env add RAZORPAY_WEBHOOK_SECRET production");
console.log("    vercel deploy --prod\n");
