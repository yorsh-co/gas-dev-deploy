// @ts-check
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DeployError } from './errors.js';

const INSTALL_HINT =
  'clasp was not found on PATH. Install it with `npm install -D @google/clasp`, then run `clasp login`.';

/**
 * @typedef {object} Deployment
 * @property {string} deploymentId
 * @property {number} [versionNumber] Absent for the HEAD deployment.
 * @property {string} [description]
 */

/**
 * @typedef {object} Clasp
 * @property {() => { loggedIn: boolean, email: string | undefined }} whoAmI
 * @property {() => void} login
 * @property {(title: string) => { scriptId: string }} create
 * @property {(scriptId?: string) => Deployment[]} listDeployments
 * @property {() => void} push
 * @property {() => void} openScript
 */

/**
 * Creates a wrapper around the `clasp` binary (found on PATH, no shell).
 *
 * @param {object} options
 * @param {string} options.cwd Directory clasp runs in.
 * @param {NodeJS.ProcessEnv} [options.env] Environment for clasp (default: the current one).
 * @returns {Clasp}
 */
export function createClasp({ cwd, env = process.env }) {
  /**
   * @param {string[]} args
   * @param {{ cwd?: string, inherit?: boolean }} [options]
   * @returns {string} stdout
   */
  function run(args, { cwd: runCwd = cwd, inherit = false } = {}) {
    const name = args.find((arg) => !arg.startsWith('-')) ?? '';
    const result = spawnSync('clasp', args, {
      cwd: runCwd,
      env,
      encoding: 'utf8',
      stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });
    if (result.error) {
      if (
        /** @type {NodeJS.ErrnoException} */ (result.error).code === 'ENOENT'
      ) {
        throw new DeployError(INSTALL_HINT, { cause: result.error });
      }
      throw new DeployError(`clasp ${name} failed: ${result.error.message}`, {
        cause: result.error,
      });
    }
    if (result.status !== 0) {
      const output = inherit
        ? ''
        : `\n${`${result.stdout ?? ''}${result.stderr ?? ''}`.trim()}`;
      throw new DeployError(
        `clasp ${name} failed (exit ${result.status}):${output}`,
      );
    }
    return result.stdout ?? '';
  }

  /**
   * Runs a `--json` command and checks the shape of its result.
   *
   * @param {string[]} args
   * @param {{ cwd?: string }} options
   * @param {'object' | 'array'} shape
   * @returns {any}
   */
  function runJson(args, options, shape = 'object') {
    const stdout = run(['--json', ...args], options);
    let data;
    try {
      data = JSON.parse(stdout);
    } catch {
      throw new DeployError(
        `clasp ${args[0]} returned invalid JSON:\n${stdout.trim()}`,
      );
    }
    const valid =
      shape === 'array'
        ? Array.isArray(data)
        : typeof data === 'object' && data !== null && !Array.isArray(data);
    if (!valid) {
      throw new DeployError(
        `clasp ${args[0]} returned an unexpected result:\n${stdout.trim()}`,
      );
    }
    return data;
  }

  return {
    whoAmI() {
      const data = /** @type {{ loggedIn?: boolean, email?: string }} */ (
        runJson(['show-authorized-user'], {})
      );
      return { loggedIn: data.loggedIn === true, email: data.email };
    },
    login() {
      run(['login'], { inherit: true });
    },
    create(title) {
      const dir = mkdtempSync(join(tmpdir(), 'gas-dev-deploy-create-'));
      try {
        const data = /** @type {{ scriptId?: string }} */ (
          runJson(['create', '--title', title, '--rootDir', dir], { cwd: dir })
        );
        if (typeof data.scriptId !== 'string' || data.scriptId === '') {
          throw new DeployError('clasp create did not return a scriptId.');
        }
        return { scriptId: data.scriptId };
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
    listDeployments(scriptId) {
      const data = runJson(
        ['deployments', ...(scriptId ? [scriptId] : [])],
        {},
        'array',
      );
      return /** @type {Deployment[]} */ (data);
    },
    push() {
      run(['push', '--force']);
    },
    openScript() {
      run(['open-script'], { inherit: true });
    },
  };
}
