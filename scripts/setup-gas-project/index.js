import dotenv from 'dotenv';

import { showStartup } from './ui/startup.js';
import { showComplete } from './ui/completion.js';
import { logger } from './ui/logger.js';

import {
  configureClasp,
  configureManifest,
  ensureAppsScriptProject,
  ensureClaspLogin,
  deployWebapp,
  pushSourceToAppsScript,
} from './services/clasp/index.js';
import {
  promptOAuthCredentials,
  promptStoreCredentialsInAppsScript,
} from './services/calendly/oauth.js';

dotenv.config();

/**
 * SETUP GAS PROJECT CLI WIZARD
 * 
 * Runs the interactive setup wizard for configuring the Google Apps Script
 * project and related deployment resources.
 *
 * Responsibilities:
 * - Ensures the user is authenticated with `clasp`
 * - Creates or reuses an Apps Script project
 * - Applies local clasp and Apps Script manifest configuration
 * - Pushes the local source to Apps Script
 * - Guides the user through manual web app deployment
 * - Collects and stores Calendly OAuth credentials
 *
 * Behavior:
 * - Allows continuing with the currently authenticated `clasp` account
 *   or authenticating with a different Google account
 * - Reuses an existing Apps Script project referenced by `.clasp.json`
 *   or creates a new project when needed
 * - Applies configuration templates from:
 *   - `.clasp.example.json`
 *   - `appsscript.example.json`
 *
 * Design notes:
 * - `clasp run` is intentionally avoided because it requires additional
 *   GCP OAuth client configuration
 * - Web app deployment is intentionally performed manually to trigger
 *   Google's OAuth consent flow for the required Apps Script scopes 
 *    without `clasp run`
 *
 * Run with:
 * `npm run gas:setup`
 */
async function main() {
  try {

    showStartup();

    await ensureClaspLogin();

    await ensureAppsScriptProject();

    await configureClasp();

    await configureManifest();

    await pushSourceToAppsScript();

    await deployWebapp();

    await promptOAuthCredentials();

    await promptStoreCredentialsInAppsScript();

    showComplete();
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
}

main();
