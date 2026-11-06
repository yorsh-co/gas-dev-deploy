import { logger } from './logger.js';

export const showDeploymentInstructions = () => {
  logger.warn('Manual WebApp Deployment Required');

  logger.highlight(
    `
You are about to be redirected to the Apps Script IDE.

In the Apps Script editor:

1. Click "Deploy"
2. Click "New deployment"
3. Select "Web app"
4. Execute as "Me"
5. Set access to "Anyone"
6. Click "Deploy"
7. Complete the Google authorization flow
8. Copy the generated Web App URL
`,
  );
};

export const showOAuthInstructions = (redirectUri) => {
  logger.highlight(`
Create Calendly OAuth credentials here:`);
logger.raw('https://developer.calendly.com/creating-an-oauth-app');

logger.highlight(`
Use this redirect URI:`);

  if (redirectUri) logger.raw(redirectUri + '\n');
  else logger.warn('REDIRECT URI NOT FOUND');
};

export const showScriptPropertiesInstructions = async (credentialsJson) => {

  logger.warn('Manual Script Property Setup Required');

  logger.highlight(
    `
In the Apps Script IDE:

1. Click: Project Settings
2. Scroll to: Script Properties
3. Click: Add script property
4. Use this key:`);

  logger.raw(`    oauth:credentials\n`);

  logger.highlight(`5. Paste this JSON value:`);

  logger.raw(credentialsJson);

  logger.highlight(`
6. Save the script property
`);
};
