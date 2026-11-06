import { prompt } from '../../lib/prompt.js';
import { sleep } from '../../lib/sleep.js';
import { failStep, runStep, succeedStep } from '../../lib/steps.js';

import { logger } from '../../ui/logger.js';

import {
  claspListProjects,
  claspLogin,
  claspShowAuthorizedUser,
} from './cli.js';

/**
 * Ensures the user is authenticated with `clasp`.
 *
 * Allows continuing with the currently authenticated account
 * or starting a new login flow.
 */
export const ensureClaspLogin = async () => {
  logger.info('Checking clasp login');

  await runStep('', async (loader) => {
    try {
      await claspListProjects();

      const user = await getCurrentUser();

      await succeedStep(loader, `Logged in as ${user}`);

      const { action } = await prompt({
        type: 'select',
        name: 'action',
        message: 'Choose a clasp account',
        choices: [
          { title: `Continue as ${user}`, value: 'continue' },
          { title: 'Login with another account', value: 'login' },
        ],
      });

      if (action === 'continue') {
        await sleep();
        return;
      }

      await runClaspLogin();
    } catch {
      await failStep(loader, 'Not logged into clasp');

      await runClaspLogin();
    }
  });
};

const runClaspLogin = async () => {
  logger.info('Starting clasp login');

  await claspLogin();

  logger.success('Successfully logged into clasp');
};

/**
 * @returns {Promise<string>}
 */
const getCurrentUser = async () => {
  const result = await claspShowAuthorizedUser();

  const output = result.stdout + result.stderr;

  const match = output.match(/You are logged in as\s+(.+)/);

  return match?.[1].trim() || 'unknown user';
};
