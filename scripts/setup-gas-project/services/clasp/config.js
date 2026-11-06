import fs from 'fs';

import { PATHS } from '../../config/paths.js';

import { runStep, succeedStep } from '../../lib/steps.js';
import { deleteFile, readJson, writeJson } from '../../lib/fs.js';
import { prompt } from '../../lib/prompt.js';

import { logger } from '../../ui/logger.js';

/**
 * Removes existing local Apps Script configuration files.
 */
export const removeConfigFiles = async () => {
  logger.info('Removing old Apps Script configuration');
  await runStep('', async (loader) => {
    const configFilePaths = [PATHS.clasp, PATHS.manifest];

    const existingFiles = configFilePaths.filter((filePath) =>
      fs.existsSync(filePath),
    );

    for (const filePath of existingFiles) {
      deleteFile(filePath);
    }

    await succeedStep(loader, 'Removed old config');
  });
};

/**
 * Applies the `.clasp.example.json` template to `.clasp.json`.
 */
export const configureClasp = async () => {
  logger.info('Configuring .clasp.json');

  await runStep('', async (loader) => {
    const config = readJson(PATHS.clasp);
    const example = readJson(PATHS.claspExample);

    Object.entries(example).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) config[k] = v;
    });

    writeJson(PATHS.clasp, config);

    await succeedStep(loader, '.clasp.json configured');
  });
};

/**
 * Applies the `appscript.example.json` template to `appscript.json`.
 */
export const configureManifest = async () => {
  logger.info('Configuring appsscript.json');

  const manifest = readJson(PATHS.manifest);
  const example = readJson(PATHS.manifestExample);

  Object.assign(manifest, example);

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

  const response = await prompt({
    type: 'text',
    name: 'timezone',
    message: 'Apps Script project timezone',
    initial: timezone,
  });

  manifest.timeZone = response.timezone;

  await runStep('Configuring manifest', async (loader) => {
    writeJson(PATHS.manifest, manifest);

    loader.succeed('appsscript.json configured');
  });
};
