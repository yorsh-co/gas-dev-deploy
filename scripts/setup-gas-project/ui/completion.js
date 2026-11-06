import { loadPkg } from '../lib/pkg.js';
import { loadEnv } from '../lib/env.js';

import { logger } from './logger.js';

export const showComplete = () => {
  const pkg = loadPkg();
  const env = loadEnv();

  logger.section('SETUP COMPLETE');

  logger.highlight(`Script ID: ${env.GAS_SCRIPT_ID}
Webapp URL: ${env.GAS_WEBAPP_URL || 'NOT DETECTED'}`);

  logger.info(`Required Next Steps:`);

  logger.highlight(`
  1. Review Calendly OAuth scopes at https://developer.calendly.com/scopes

  2. If this library will be used by Apps Script projects owned by other Google accounts,
     make sure this Apps Script project is shared with viewer access:

     ⚠ Warning: Do not grant edit access to untrusted users.

  3. Add this Apps Script project as a library in your target Apps Script project.
     Library Identifier: CalendlyAuth
     Script ID: ${env.GAS_SCRIPT_ID}
`);

  logger.warn('Review the required next steps above before using this library');
};
