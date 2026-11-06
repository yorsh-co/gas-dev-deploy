import { loadPkg } from '../lib/pkg.js';
import { logger } from './logger.js';

export const showStartup = () => {
  const pkg = loadPkg();

  logger.banner([
    '██╗   ██╗ ██████╗ ██████╗ ███████╗██╗  ██╗',
    '╚██╗ ██╔╝██╔═══██╗██╔══██╗██╔════╝██║  ██║',
    ' ╚████╔╝ ██║   ██║██████╔╝███████╗███████║',
    '  ╚██╔╝  ██║   ██║██╔══██╗╚════██║██╔══██║',
    '   ██║   ╚██████╔╝██║  ██║███████║██║  ██║',
    '   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝',
  ]);

  logger.highlight(`
${pkg.description}

Project       : ${pkg.name}
License       : ${pkg.license}
Version       : v${pkg.version}

Author        : ${pkg.author}

Repo          : ${pkg.repository.url}

This setup wizard will:

  ✓ Authenticate with clasp
  ✓ Create a new Apps Script project
  ✓ Configure clasp + manifest files
  ✓ Push your local source code
  ✓ Guide you through web app deployment
  ✓ Configure OAuth credentials
  ✓ Prepare your project for library sharing

Powered by ◈ ${pkg.yorsh.organization}
${pkg.yorsh.homepage}
`);

  logger.muted(`You are responsible for all Google Apps Script,
Google Workspace, Calendly API, and OAuth configurations
created or modified using this tool.

Review the README, LICENSE, and platform documentation
before deploying to production.

`);

  logger.warn(`Apps Script API must be enabled before continuing`);

  logger.raw(`https://script.google.com/home/usersettings\n`);

  logger.divider();
};
