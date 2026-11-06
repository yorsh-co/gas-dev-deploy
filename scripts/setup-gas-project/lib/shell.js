import { execa } from 'execa';

/**
 * Executes a command and captures its output.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {import('execa').Options} [options] Execa options.
 *
 * @returns {Promise<import('execa').ExecaReturnValue>}
 */
export const runCmd = async (cmd, args, options = {}) => {
  return execa(cmd, args, {
    stdio: 'pipe',
    ...options,
  });
};

/**
 * Executes a command using the current terminal session.
 *
 * @param {string} cmd
 * @param {string[]} args
 *
 * @returns {Promise<import('execa').ExecaReturnValue>}
 */
export const runInteractiveCmd = async (cmd, args) => {
  return execa(cmd, args, {
    stdio: 'inherit',
  });
};
