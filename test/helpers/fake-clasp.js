#!/usr/bin/env node
// @ts-check
// Stand-in for clasp. Logs every call to $FAKE_CLASP_LOG; env vars pick the outcome:
// FAKE_CLASP_USER (email, empty = logged out), FAKE_CLASP_SCRIPT_ID, FAKE_CLASP_DEPLOYMENTS (JSON),
// FAKE_CLASP_FAIL (command name that exits 1), FAKE_CLASP_OUTPUT (raw stdout for the
// show-authorized-user and create commands).
import {
  appendFileSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);

/** @param {string} value */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * Installs the fake as `clasp` in a new temp bin dir.
 *
 * @returns {{ binDir: string, logPath: string, cleanup: () => void }}
 */
export function installFakeClasp() {
  const dir = mkdtempSync(join(tmpdir(), 'fake-clasp-'));
  const binDir = join(dir, 'bin');
  mkdirSync(binDir);
  const wrapper = join(binDir, 'clasp');
  writeFileSync(
    wrapper,
    `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(SCRIPT)} "$@"\n`,
  );
  chmodSync(wrapper, 0o755);
  return {
    binDir,
    logPath: join(dir, 'calls.log'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

/**
 * Reads the calls logged by the fake.
 *
 * @param {string} logPath
 * @returns {{ args: string[], cwd: string }[]}
 */
export function readCalls(logPath) {
  try {
    return readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

/** Handles one invocation. */
function main() {
  const args = process.argv.slice(2);
  const env = process.env;
  appendFileSync(
    /** @type {string} */ (env.FAKE_CLASP_LOG),
    `${JSON.stringify({ args, cwd: process.cwd() })}\n`,
  );
  const rest = args.filter((arg) => arg !== '--json');
  const [command = '', ...params] = rest;

  if (env.FAKE_CLASP_FAIL === command) {
    process.stderr.write(`${command} exploded\n`);
    process.exit(1);
  }
  const json = (/** @type {unknown} */ value) =>
    process.stdout.write(`${JSON.stringify(value)}\n`);

  if (
    env.FAKE_CLASP_OUTPUT !== undefined &&
    (command === 'show-authorized-user' || command === 'create')
  ) {
    process.stdout.write(`${env.FAKE_CLASP_OUTPUT}\n`);
  } else if (command === 'show-authorized-user') {
    const email = env.FAKE_CLASP_USER ?? '';
    json(email ? { loggedIn: true, email } : { loggedIn: false });
  } else if (command === 'create') {
    const rootDir = /** @type {string} */ (
      params[params.indexOf('--rootDir') + 1]
    );
    const scriptId = env.FAKE_CLASP_SCRIPT_ID ?? 'script-123';
    writeFileSync(
      join(rootDir, '.clasp.json'),
      JSON.stringify({ scriptId, rootDir }),
    );
    writeFileSync(
      join(rootDir, 'appsscript.json'),
      JSON.stringify({ timeZone: 'America/New_York' }),
    );
    json({ scriptId });
  } else if (command === 'deployments') {
    process.stdout.write(`${env.FAKE_CLASP_DEPLOYMENTS ?? '[]'}\n`);
  } else if (
    (command === 'push' && params.join(' ') === '--force') ||
    command === 'login' ||
    command === 'open-script'
  ) {
    process.stdout.write(`${command} ok\n`);
  } else {
    process.stderr.write(`unexpected clasp call: ${args.join(' ')}\n`);
    process.exit(1);
  }
}

if (basename(process.argv[1] ?? '') === basename(SCRIPT)) {
  main();
}
