import prompts from 'prompts';

import { logger } from '../ui/logger.js';

/**
 * Thin wrapper around `prompts` that ensures consistent CTRL+C handling
 * across the setup flow.
 *
 * The default `prompts` cancellation behavior is overridden so the CLI:
 * - logs a user-friendly cancellation message
 * - exits cleanly with status code `0`
 */
export const prompt = async (
  questions,
  options = {},
) => {
  return prompts(questions, {
    onCancel: () => {
      logger.warn('Setup cancelled');

      process.exit(0);
    },

    ...options,
  });
};