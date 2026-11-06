import fs from 'fs';

import { PATHS } from '../../config/paths.js';

import { updateEnv } from '../../lib/env.js';
import { readJson } from '../../lib/fs.js';
import { loadPkg } from '../../lib/pkg.js';
import { runCmd } from '../../lib/shell.js';
import { failStep, runStep, succeedStep } from '../../lib/steps.js';
import { prompt } from '../../lib/prompt.js';

import { logger } from '../../ui/logger.js';

import { removeConfigFiles } from './config.js';
import { PROJECT_STRATEGIES } from './constants.js';

/**
 * Ensures an Apps Script project is available for the setup flow.
 *
 * Allows creating a new project or reusing an existing project
 * referenced by the local clasp configuration.
 *
 * @returns {Promise<string>}
 */
export const ensureAppsScriptProject = async () => {
  logger.info(`Building Apps Script configuration`);

  const strategy = await resolveProjectStrategy();

  if (strategy !== PROJECT_STRATEGIES.REUSE) {
    logger.success('Configuration ready');

    return createNewProject();
  }
  const scriptId = await loadExistingProject();

  if (scriptId) {
    return scriptId;
  }

  const shouldCreate = await confirmProjectCreation();

  if (!shouldCreate) {
    throw new Error('Operation cancelled');
  }

  await removeConfigFiles();

  return createNewProject();
};

/**
 * Creates a new Apps Script project using `clasp create`.
 *
 * @returns {Promise<string>}
 */
const createNewProject = async () => {
  logger.info('Creating Apps Script project');

  return runStep('', async (loader) => {
    const pkg = loadPkg();

    const title = `${pkg.name} - ${pkg.yorsh?.organization || pkg.description}`;

    const result = await runCmd('clasp', ['create', '--title', title]);

    const output = result.stdout + result.stderr;

    const scriptIdMatch = output.match(
      /https:\/\/script\.google\.com\/d\/([a-zA-Z0-9-_]+)/i,
    );

    if (!scriptIdMatch) {
      logger.raw(output);
      throw new Error('Could not determine script ID');
    }

    const scriptId = scriptIdMatch[1];

    updateEnv({
      GAS_SCRIPT_ID: scriptId,
    });

    await succeedStep(
      loader,
      `Apps Script project created\nScript ID: ${scriptId}`,
    );

    return scriptId;
  });
};

/**
 * Loads and validates the Apps Script project referenced by
 * the local `.clasp.json` configuration.
 *
 * @returns {Promise<string|null>}
 */
const loadExistingProject = async () => {
  const claspConfig = readJson(PATHS.clasp);

  const scriptId = claspConfig.scriptId;

  if (!scriptId) {
    logger.warn('Existing .clasp.json does not contain a scriptId');

    return null;
  }

  const exists = await validateProject(scriptId);

  if (!exists) {
    return null;
  }

  updateEnv({
    GAS_SCRIPT_ID: scriptId,
  });

  return scriptId;
};

/**
 * Verifies that the provided Apps Script project exists
 * and is accessible through `clasp`.
 *
 * @param {string} scriptId Apps Script project ID.
 * @returns {Promise<boolean>}
 */
const validateProject = async (scriptId) => {
  return runStep('', async (loader) => {
    try {
      await runCmd('clasp', ['deployments', scriptId]);

      await succeedStep(
        loader,
        `Loaded Apps Script configuration\nScript ID: ${scriptId}`,
      );

      return true;
    } catch (err) {
      const output = `${err.stdout || ''}\n${err.stderr || ''}`;

      if (
        output.includes('Invalid ID') ||
        output.includes('Script not found')
      ) {
        await failStep(loader, `Apps Script project ${scriptId} was not found`);

        return false;
      }
      throw err;
    }
  });
};

/**
 * Determines how the setup flow should handle existing
 * local Apps Script configuration files.
 *
 * @returns {Promise<string>}
 */
const resolveProjectStrategy = async () => {
  const configFilePaths = [PATHS.clasp, PATHS.manifest];

  const existingFiles = configFilePaths.filter((filePath) =>
    fs.existsSync(filePath),
  );

  if (!existingFiles.includes(PATHS.clasp)) {
    return PROJECT_STRATEGIES.CREATE;
  }

  logger.warn(`Existing Apps Script configuration detected`);

  logger.raw(
    `The following Apps Script config files already exist\n${existingFiles.map((filePath) => `- ${filePath}`).join('\n')}`,
  );

  const response = await prompt({
    type: 'select',
    name: 'strategy',
    message: 'How would you like to proceed?',
    choices: [
      {
        title: 'Create a new Apps Script project',
        value: PROJECT_STRATEGIES.CREATE,
      },
      {
        title: 'Use existing Apps Script project',
        value: PROJECT_STRATEGIES.REUSE,
      },
    ],
  });

  if (response.strategy === PROJECT_STRATEGIES.CREATE) {
    await removeConfigFiles();
  }

  return response.strategy;
};

/**
 * @returns {Promise<boolean>}
 */
const confirmProjectCreation = async () => {
  const response = await prompt({
    type: 'confirm',
    name: 'create',
    message: 'Would you like to create a new Apps Script project?',
    initial: true,
  });

  return response.create;
};
