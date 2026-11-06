// @ts-check
import { parseArgs } from 'node:util';
import pkg from '../package.json' with { type: 'json' };
import { CancelledError, DeployError } from './errors.js';

const OPTIONS = /** @type {const} */ ({
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean' },
});

const USAGE = `Usage: gas-dev-deploy

Guided setup and deployment of a Google Apps Script web app with clasp.

Options:
  -h, --help  Show this help
  --version   Show the version
`;

/**
 * Placeholder until the wizard is implemented.
 *
 * @returns {Promise<void>}
 */
async function deploy() {
  throw new DeployError('Not implemented.');
}

/**
 * Runs the CLI.
 *
 * @param {string[]} argv Command-line arguments, without the node and script paths.
 * @returns {Promise<number>} The process exit code: 0 on success, 1 on a failed deployment, 2 on invalid usage,
 * 130 when the user cancels a prompt.
 */
export async function main(argv) {
  /** @type {ReturnType<typeof parseArgs<{ options: typeof OPTIONS, strict: true, allowPositionals: false }>>['values']} */
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: OPTIONS,
      strict: true,
      allowPositionals: false,
    }));
  } catch (error) {
    const { code, message } = /** @type {Error & { code?: string }} */ (error);
    if (!code?.startsWith('ERR_PARSE_ARGS_')) throw error;
    // Node appends advice about `--` that does not apply to this CLI.
    const summary = message.split('. ')[0]?.replace(/\.$/, '');
    process.stderr.write(
      `gas-dev-deploy: ${summary}.\nRun gas-dev-deploy --help for usage.\n`,
    );
    return 2;
  }
  if (values.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${pkg.version}\n`);
    return 0;
  }
  try {
    await deploy();
    return 0;
  } catch (error) {
    if (error instanceof CancelledError) {
      process.stderr.write('Cancelled.\n');
      return 130;
    }
    if (error instanceof DeployError) {
      process.stderr.write(`gas-dev-deploy: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
