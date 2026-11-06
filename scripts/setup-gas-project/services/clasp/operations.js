import { runCmd } from '../../lib/shell.js';
import { runStep, succeedStep } from '../../lib/steps.js';

import { logger } from '../../ui/logger.js';

import { claspPush } from './cli.js';

export const pushSourceToAppsScript = async () => {
  logger.info('Pushing local files to Apps Script');
  await runStep('', async (loader) => {
    await claspPush({ force: true });

    await succeedStep(loader, 'Project pushed');
  });
};
