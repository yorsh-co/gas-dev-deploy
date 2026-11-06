// @ts-check
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deploy } from '../src/deploy.js';
import { createIo } from '../src/io.js';
import { installFakeClasp, readCalls } from './helpers/fake-clasp.js';
import { cleanup, createProject } from './helpers/project.js';

const BIN = fileURLToPath(new URL('../bin/gas-dev-deploy.js', import.meta.url));
const DEPLOYMENTS = JSON.stringify([
  { deploymentId: 'HEAD-id', description: '@HEAD' },
  { deploymentId: 'AKfy-1', versionNumber: 1, description: 'one' },
  { deploymentId: 'AKfy-2', versionNumber: 2, description: 'two' },
]);

/** @type {{ binDir: string, logPath: string, cleanup: () => void }} */
let fake;

beforeEach(() => {
  fake = installFakeClasp();
});

afterEach(() => {
  fake.cleanup();
  cleanup();
});

/**
 * Runs the CLI in a project with the fake clasp; prompt answers are injected through a preload.
 *
 * @param {string} cwd
 * @param {unknown[]} answers Values for `prompts.inject`; `null` cancels the prompt.
 * @param {NodeJS.ProcessEnv} [env]
 */
function runCli(cwd, answers, env = {}) {
  const preload = join(fake.binDir, '..', 'inject.mjs');
  const promptsUrl = new URL(
    '../node_modules/prompts/index.js',
    import.meta.url,
  ).href;
  writeFileSync(
    preload,
    `import prompts from ${JSON.stringify(promptsUrl)};\nprompts.inject(${JSON.stringify(answers)}.map((a) => (a === null ? new Error('cancel') : a)));\n`,
  );
  return spawnSync(process.execPath, ['--import', preload, BIN], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fake.binDir}:${process.env.PATH}`,
      FAKE_CLASP_LOG: fake.logPath,
      ...env,
    },
  });
}

describe('deploy', () => {
  it('runs the wizard end to end', () => {
    const cwd = createProject({
      git: true,
      gitignore: '.env\n.clasp.json\nappsscript.json\n',
      clasp: { scriptId: '', rootDir: 'src' },
    });
    const result = runCli(cwd, ['keep', 'Etc/UTC', '', true], {
      FAKE_CLASP_USER: 'dev@example.com',
      FAKE_CLASP_DEPLOYMENTS: DEPLOYMENTS,
      FAKE_CLASP_SCRIPT_ID: 'script-9',
    });
    expect(result.stderr).toBe(
      'Warning: Manual web app deployment required.\n',
    );
    expect(result.status).toBe(0);

    const commands = readCalls(fake.logPath).map((c) =>
      c.args
        .filter((a) => a !== '--json')
        .slice(0, 1)
        .join(''),
    );
    expect(commands).toEqual([
      'show-authorized-user',
      'create',
      'push',
      'open-script',
      'deployments',
    ]);

    expect(JSON.parse(readFileSync(join(cwd, '.clasp.json'), 'utf8'))).toEqual({
      scriptId: 'script-9',
      rootDir: 'src',
    });
    expect(
      JSON.parse(readFileSync(join(cwd, 'src/appsscript.json'), 'utf8')),
    ).toMatchObject({ timeZone: 'Etc/UTC', runtimeVersion: 'V8' });
    expect(readFileSync(join(cwd, '.env'), 'utf8')).toBe(
      [
        'GAS_SCRIPT_ID=script-9',
        'GAS_WEBAPP_URL=https://script.google.com/macros/s/AKfy-2/exec',
        'GAS_DEPLOYMENT_ID=AKfy-2',
        'GAS_VERSION=2',
        '',
      ].join('\n'),
    );
    expect(result.stdout).toContain('Script ID:     script-9');
    expect(result.stdout).toContain(
      'Web app URL:   https://script.google.com/macros/s/AKfy-2/exec',
    );
    expect(result.stdout).toContain('Version:       2');
  });

  it('runs in process through the exported deploy()', async () => {
    const cwd = createProject({
      git: true,
      gitignore: '.env\n.clasp.json\nappsscript.json\n',
      clasp: { scriptId: '', rootDir: 'src' },
    });
    const overrides = {
      PATH: `${fake.binDir}:${process.env.PATH}`,
      FAKE_CLASP_LOG: fake.logPath,
      FAKE_CLASP_USER: 'dev@example.com',
      FAKE_CLASP_DEPLOYMENTS: DEPLOYMENTS,
      FAKE_CLASP_SCRIPT_ID: 'script-9',
    };
    const saved = Object.fromEntries(
      Object.keys(overrides).map((key) => [key, process.env[key]]),
    );
    Object.assign(process.env, overrides);
    const out = new PassThrough();
    const err = new PassThrough();
    /** @type {Buffer[]} */
    const chunks = [];
    out.on('data', (chunk) => chunks.push(chunk));
    try {
      prompts.inject(['keep', 'Etc/UTC', '', true]);
      await deploy(
        cwd,
        createIo({
          stdout: /** @type {any} */ (out),
          stderr: /** @type {any} */ (err),
        }),
      );
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }

    const commands = readCalls(fake.logPath).map((c) =>
      c.args[0] === '--json' ? c.args[1] : c.args[0],
    );
    expect(commands).toEqual([
      'show-authorized-user',
      'create',
      'push',
      'open-script',
      'deployments',
    ]);
    expect(JSON.parse(readFileSync(join(cwd, '.clasp.json'), 'utf8'))).toEqual({
      scriptId: 'script-9',
      rootDir: 'src',
    });
    expect(readFileSync(join(cwd, '.env'), 'utf8')).toContain(
      'GAS_DEPLOYMENT_ID=AKfy-2\n',
    );
    const stdout = Buffer.concat(chunks).toString('utf8');
    expect(stdout).toContain('Script ID:     script-9');
    expect(stdout).toContain(
      'Web app URL:   https://script.google.com/macros/s/AKfy-2/exec',
    );
  });

  it('exits 1 without running clasp when .env is not ignored', () => {
    const cwd = createProject({ git: true, gitignore: 'node_modules\n' });
    const result = runCli(cwd, []);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^gas-dev-deploy: \.env is not ignored/);
    expect(readCalls(fake.logPath)).toEqual([]);
    expect(existsSync(join(cwd, '.env'))).toBe(false);
  });

  it('exits 130 when a prompt is cancelled', () => {
    const cwd = createProject();
    const result = runCli(cwd, [null], {
      FAKE_CLASP_USER: 'dev@example.com',
    });
    expect(result.status).toBe(130);
    expect(result.stderr).toBe('Cancelled.\n');
  });
});
