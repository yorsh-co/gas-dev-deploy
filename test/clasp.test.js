// @ts-check
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createClasp } from '../src/clasp.js';
import { DeployError } from '../src/errors.js';
import {
  installFakeClasp,
  readCalls as readLoggedCalls,
} from './helpers/fake-clasp.js';

/** @type {{ binDir: string, logPath: string, cleanup: () => void }} */
let fake;

/** @returns {{ args: string[], cwd: string }[]} */
function readCalls() {
  return readLoggedCalls(fake.logPath);
}

/** @param {number} index */
function callAt(index) {
  return /** @type {{ args: string[], cwd: string }} */ (readCalls()[index]);
}

/** @type {NodeJS.ProcessEnv} */
let baseEnv;

/** @param {NodeJS.ProcessEnv} [extra] */
function clasp(extra = {}) {
  return createClasp({
    cwd: tmpdir(),
    env: { ...baseEnv, ...extra },
  });
}

beforeEach(() => {
  fake = installFakeClasp();
  baseEnv = {
    PATH: `${fake.binDir}:${process.env.PATH}`,
    FAKE_CLASP_LOG: fake.logPath,
  };
});

afterEach(() => fake.cleanup());

describe('whoAmI', () => {
  it('returns the logged-in user', () => {
    expect(clasp({ FAKE_CLASP_USER: 'a@b.co' }).whoAmI()).toEqual({
      loggedIn: true,
      email: 'a@b.co',
    });
    expect(callAt(0).args).toEqual(['--json', 'show-authorized-user']);
  });

  it.each(['not json', 'null', '[]', '"x"'])(
    'rejects invalid or non-object output %j',
    (output) => {
      expect(() => clasp({ FAKE_CLASP_OUTPUT: output }).whoAmI()).toThrow(
        'clasp show-authorized-user returned',
      );
    },
  );

  it('reports a logged-out user', () => {
    expect(clasp().whoAmI().loggedIn).toBe(false);
  });
});

describe('create', () => {
  it('creates in a temp dir, returns the script id and removes the dir', () => {
    const before = readdirSync(tmpdir()).filter((n) =>
      n.startsWith('gas-dev-deploy-create-'),
    );
    expect(clasp({ FAKE_CLASP_SCRIPT_ID: 'abc' }).create('My App')).toEqual({
      scriptId: 'abc',
    });
    const call = callAt(0);
    expect(call.args.slice(0, 4)).toEqual([
      '--json',
      'create',
      '--title',
      'My App',
    ]);
    expect(call.args[4]).toBe('--rootDir');
    expect(existsSync(/** @type {string} */ (call.args[5]))).toBe(false);
    expect(call.cwd).not.toBe(tmpdir());
    const after = readdirSync(tmpdir()).filter((n) =>
      n.startsWith('gas-dev-deploy-create-'),
    );
    expect(after).toEqual(before);
  });

  it.each(['{}', '{"scriptId":""}', 'null'])(
    'rejects output without a scriptId: %s',
    (output) => {
      expect(() => clasp({ FAKE_CLASP_OUTPUT: output }).create('x')).toThrow(
        DeployError,
      );
    },
  );

  it('removes the temp dir when clasp fails', () => {
    expect(() => clasp({ FAKE_CLASP_FAIL: 'create' }).create('x')).toThrow(
      /clasp create failed \(exit 1\):\ncreate exploded/,
    );
    const call = callAt(0);
    expect(existsSync(/** @type {string} */ (call.args[5]))).toBe(false);
  });
});

describe('listDeployments', () => {
  const deployments = [
    { deploymentId: 'AKfy1' },
    { deploymentId: 'AKfy2', versionNumber: 3, description: 'v3' },
  ];

  it('parses the JSON with and without a script id', () => {
    const c = clasp({ FAKE_CLASP_DEPLOYMENTS: JSON.stringify(deployments) });
    expect(c.listDeployments()).toEqual(deployments);
    expect(c.listDeployments('sid')).toEqual(deployments);
    expect(readCalls().map((call) => call.args)).toEqual([
      ['--json', 'deployments'],
      ['--json', 'deployments', 'sid'],
    ]);
  });

  it('includes the output when stdout is not JSON', () => {
    expect(() =>
      clasp({ FAKE_CLASP_DEPLOYMENTS: 'not json' }).listDeployments(),
    ).toThrow(/invalid JSON:\nnot json/);
  });

  it('rejects a non-array result', () => {
    expect(() =>
      clasp({ FAKE_CLASP_DEPLOYMENTS: '{}' }).listDeployments(),
    ).toThrow(DeployError);
  });
});

describe('push, login and openScript', () => {
  it('runs the expected commands', () => {
    const c = clasp();
    c.push();
    c.login();
    c.openScript();
    expect(readCalls().map((call) => call.args)).toEqual([
      ['push', '--force'],
      ['login'],
      ['open-script'],
    ]);
  });

  it('reports failures with the exit code and output', () => {
    expect(() => clasp({ FAKE_CLASP_FAIL: 'push' }).push()).toThrow(
      'clasp push failed (exit 1):\npush exploded',
    );
  });
});

describe('inherit-stdio commands', () => {
  it.each([
    ['login', (/** @type {ReturnType<typeof clasp>} */ c) => c.login()],
    [
      'open-script',
      (/** @type {ReturnType<typeof clasp>} */ c) => c.openScript(),
    ],
  ])('%s failure reports the exit code', (name, call) => {
    expect(() => call(clasp({ FAKE_CLASP_FAIL: name }))).toThrow(
      new RegExp(`clasp ${name} failed \\(exit 1\\):`),
    );
  });
});

describe('spawn errors', () => {
  it('wraps a non-ENOENT error in a DeployError', () => {
    const binDir = join(fake.binDir, '..', 'noexec');
    mkdirSync(binDir);
    writeFileSync(join(binDir, 'clasp'), 'x');
    chmodSync(join(binDir, 'clasp'), 0o644);
    const c = createClasp({ cwd: tmpdir(), env: { PATH: binDir } });
    expect(() => c.push()).toThrow(DeployError);
    expect(() => c.push()).toThrow(/clasp push failed: .*EACCES/);
  });
});

describe('missing binary', () => {
  it('gives an install hint', () => {
    const c = createClasp({ cwd: tmpdir(), env: { PATH: '' } });
    expect(() => c.push()).toThrow(/npm install -D @google\/clasp/);
    expect(() => c.push()).toThrow(DeployError);
  });
});

it('uses a distinct temp dir per create call', () => {
  const c = clasp();
  c.create('a');
  c.create('b');
  expect(callAt(0).args[5]).not.toBe(callAt(1).args[5]);
});
