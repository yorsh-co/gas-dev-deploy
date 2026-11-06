import { loadEnv, updateEnv } from '../../lib/env.js';
import { sleep } from '../../lib/sleep.js';
import { prompt } from '../../lib/prompt.js';

import {
  showOAuthInstructions,
  showScriptPropertiesInstructions,
} from '../../ui/instructions.js';
import { logger } from '../../ui/logger.js';

import { claspOpenScript } from '../clasp/index.js';

/**
 *
 * @returns
 */
export const promptOAuthCredentials = async () => {
  logger.info('Calendly OAuth setup');

  const env = loadEnv();

  if (env.CALENDLY_CLIENT_ID && env.CALENDLY_CLIENT_SECRET) {
    logger.warn('Existing Calendly OAuth credentials detected');

    const response = await prompt({
      type: 'confirm',
      name: 'new',
      message: 'Would you like to provide new credentials?',
      initial: true,
    });

    if (!response.new) {
      logger.success('Calendly OAuth credentials loaded');

      await sleep();

      return;
    }

    await sleep();
  }

  showOAuthInstructions(env.GAS_WEBAPP_URL);

  const response = await prompt([
    {
      type: 'text',
      name: 'clientId',
      message: 'OAuth Client ID',
    },
    {
      type: 'password',
      name: 'clientSecret',
      message: 'OAuth Client Secret',
    },
  ]);

  updateEnv({
    CALENDLY_CLIENT_ID: response.clientId,
    CALENDLY_CLIENT_SECRET: response.clientSecret,
  });

  logger.success('Calendly OAuth credentials stored locally');

  await sleep();

  return response;
};

/**
 *
 */
export const promptStoreCredentialsInAppsScript = async () => {
  logger.info('Preparing OAuth credentials for Script Properties');

  const env = loadEnv();

  const credentials = {
    clientId: env.CALENDLY_CLIENT_ID,
    clientSecret: env.CALENDLY_CLIENT_SECRET,
    redirectUri: env.GAS_WEBAPP_URL,
  };

  showScriptPropertiesInstructions(JSON.stringify(credentials, null, 2));

  await claspOpenScript();

  await prompt({
    type: 'text',
    name: 'complete',
    message: 'After saving the Script Property, press ENTER to continue',
  });

  logger.success('Apps Script OAuth credentials configured');

  await sleep();
};
