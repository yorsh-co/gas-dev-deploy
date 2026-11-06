import { runCmd, runInteractiveCmd } from '../../lib/shell.js';
import { logger } from '../../ui/logger.js';

export const claspListProjects = () => runCmd('clasp', ['list']);

export const claspLogin = () => runInteractiveCmd('clasp', ['login']);

export const claspShowAuthorizedUser = () =>
  runCmd('clasp', ['show-authorized-user']);

/**
 * @param {string} title
 */
export const claspCreateProject = (title) =>
  runCmd('clasp', ['create', '--title', title]);

/**
 * @param {string} scriptId
 */
export const claspListDeployments = (scriptId) =>
  runCmd('clasp', ['deployments', scriptId]);

/**
 *
 * @param {Object} options
 * @param {boolean} [options.force=false]
 */
export const claspPush = (options = {}) => {
  const { force = false } = options;

  const args = ['push'];

  if (force) args.push('--force');

  return runCmd('clasp', args);
};

export const claspOpenScript = async () => {
  await runInteractiveCmd('clasp', ['open-script']);
  logger.newline();
};
