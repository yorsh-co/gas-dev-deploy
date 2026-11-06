import { updateEnv } from '../../lib/env.js';
import { runCmd } from '../../lib/shell.js';
import { sleep } from '../../lib/sleep.js';
import { failStep, runStep, succeedStep } from '../../lib/steps.js';
import { prompt } from '../../lib/prompt.js';

import { logger } from '../../ui/logger.js';
import { showDeploymentInstructions } from '../../ui/instructions.js';

import { claspOpenScript } from './cli.js';

/**
 * Guides the user through manual Apps Script web app deployment
 * and stores the resulting deployment configuration.
 */
export const deployWebapp = async () => {
  logger.info('Preparing webapp deployment');

  showDeploymentInstructions();

  await claspOpenScript();

  const response = await prompt({
    type: 'text',
    name: 'webappUrl',
    message: 'Paste the deployed Web App URL',
    validate: (value) => {
      const isValid =
        /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/(exec|dev)\/?$/.test(
          value,
        );

      if (!isValid) {
        return 'Please enter a valid Apps Script Web App URL';
      }

      return true;
    },
  });

  updateEnv({
    GAS_WEBAPP_URL: response.webappUrl,
  });

  logger.success('Stored Web App URL');

  await sleep();

  await getDeploymentDetails();

  return response.webappUrl;
};

/**
 * Retrieves and stores the active Apps Script deployment details
 * from `clasp deployments`.
 */
const getDeploymentDetails = async () => {
  logger.info('Getting deployment details');

  await runStep('', async (loader) => {
    const result = await runCmd('clasp', ['deployments']);

    const output = result.stdout + result.stderr;

    const lines = output.split('\n');

    const deploymentLine = lines.find(
      (line) => line.startsWith('- ') && !line.includes('@HEAD'),
    );
    if (!deploymentLine) {
      return failStep(loader, 'Could not find a non-HEAD deployment');
    }

    const deployMatch = deploymentLine.match(
      /-\s+(?<deploymentId>[a-zA-Z0-9-_]+)\s+@(?<version>\d+)/i,
    );
    if (!deployMatch) {
      return failStep(loader, 'Could not determine deployment info');
    }

    const { deploymentId, version } = deployMatch?.groups || {};

    updateEnv({
      GAS_DEPLOYMENT_ID: deploymentId,
      GAS_VERSION: version,
    });

    await succeedStep(
      loader,
      `Deployment ID: ${deploymentId}. Version: ${version}`,
    );
  });
};
