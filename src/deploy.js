// @ts-check
import pkg from '../package.json' with { type: 'json' };
import { createClasp } from './clasp.js';
import { loadConfig } from './config.js';
import { assertEnvIgnored } from './env.js';
import { configure } from './steps/configure.js';
import { deployment } from './steps/deployment.js';
import { login } from './steps/login.js';
import { project } from './steps/project.js';
import { push } from './steps/push.js';

/**
 * Runs the deployment wizard for the project in `cwd`.
 *
 * @param {string} cwd Project root.
 * @param {import('./io.js').Io} io Console helpers.
 * @returns {Promise<void>}
 * @throws {import('./errors.js').DeployError} On invalid configuration or a failed step.
 * @throws {import('./errors.js').CancelledError} When the user cancels a prompt.
 */
export async function deploy(cwd, io) {
  const config = loadConfig(cwd);
  assertEnvIgnored(cwd);
  io.log.raw(`${pkg.name} ${pkg.version}`);
  io.log.info(`Project: ${config.title}`);

  /** @type {import('./steps/login.js').StepContext} */
  const ctx = { cwd, config, clasp: createClasp({ cwd }), io, state: {} };
  await login(ctx);
  await project(ctx);
  await configure(ctx);
  await push(ctx);
  await deployment(ctx);

  const result = ctx.state.deployment;
  if (result) {
    io.log.section('Summary');
    io.log.raw(`Script ID:     ${result.scriptId}`);
    io.log.raw(`Web app URL:   ${result.webappUrl}`);
    io.log.raw(`Deployment ID: ${result.deploymentId}`);
    io.log.raw(`Version:       ${result.version}`);
    io.log.raw(
      '\nTo use the project as a library, share it with the consuming accounts.',
    );
  }
}
