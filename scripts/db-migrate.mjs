/**
 * Apply src/lib/db/schema.sql to the Neon database.
 *
 *   npm run db:migrate
 *
 * Idempotent by construction: every statement in the schema is
 * `CREATE TABLE IF NOT EXISTS` or `CREATE INDEX IF NOT EXISTS`, so running this
 * against an existing database changes nothing and running it twice is safe.
 * That is deliberate — there is no migration framework here, and there does not
 * need to be one for a schema this size. A future column is added by editing
 * the schema file and adding an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
 *
 * Neon's HTTP endpoint runs one statement per request, so the file is split and
 * the statements are sent in order. They are DDL from a file in this
 * repository, not user input.
 */

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const ENV_FILE = ".env.local";
const SCHEMA_FILE = "src/lib/db/schema.sql";

/* ------------------------------------------------------------------ env -- */

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

// A value already in the environment wins, so `DATABASE_URL=... npm run
// db:migrate` can target a different database without editing any file.
const env = readEnv();
const databaseUrl = process.env.DATABASE_URL?.trim() || env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    `✗ DATABASE_URL is not set.\n\n` +
      `  Create the database first: Vercel dashboard → your project → Storage →\n` +
      `  Neon → Create. That injects DATABASE_URL into the deployment.\n\n` +
      `  Then pull it locally:  vercel env pull ${ENV_FILE}\n` +
      `  or add the connection string to ${ENV_FILE} by hand.`,
  );
  process.exit(1);
}

/* --------------------------------------------------------------- schema -- */

let schema;
try {
  schema = readFileSync(SCHEMA_FILE, "utf8");
} catch {
  console.error(`✗ Could not read ${SCHEMA_FILE}. Run this from the project root.`);
  process.exit(1);
}

/**
 * Split the file into statements.
 *
 * Comments are stripped first so a `;` inside one cannot end a statement early.
 * This is deliberately simple, and it is safe for exactly this file: there are
 * no dollar-quoted function bodies and no string literals containing
 * semicolons. Add either and this needs a real parser.
 */
const statements = schema
  .split(/\r?\n/)
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

if (statements.length === 0) {
  console.error(`✗ ${SCHEMA_FILE} produced no statements.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ run -- */

const sql = neon(databaseUrl);

console.log(`Applying ${statements.length} statements from ${SCHEMA_FILE}…\n`);

for (const [index, statement] of statements.entries()) {
  // The first line is enough to recognise which statement is running, without
  // printing a wall of SQL.
  const label = statement.split("\n")[0].slice(0, 72);
  try {
    await sql.query(statement);
    console.log(`  ${String(index + 1).padStart(2)} ✓ ${label}`);
  } catch (error) {
    console.error(`\n✗ Failed on statement ${index + 1}:\n\n${statement}\n`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

/* Prove the tables are actually there rather than trusting the absence of an
   error, and report what is already stored. */
try {
  const [registrations] = await sql.query(
    "SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE key_mode = 'live')::int AS live FROM registrations",
  );
  console.log(
    `\n✓ Schema applied. registrations: ${registrations.n} rows (${registrations.live} live).`,
  );
  if (registrations.n === 0) {
    console.log(
      "\n  The table is empty. To import the registrations that already exist as\n" +
        "  Razorpay orders, open /admin and use “Sync from Razorpay”. It is\n" +
        "  idempotent, so it is safe to run more than once.",
    );
  }
} catch (error) {
  console.error(`\n✗ Schema applied, but verification failed: ${error.message}`);
  process.exit(1);
}
