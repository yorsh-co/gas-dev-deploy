import { logger } from '../ui/logger.js';
import { sleep } from './sleep.js';

/**
 * Runs a setup step with a loading indicator.
 *
 * @template T
 *
 * @param {string} message
 * @param {(loader: import('ora').Ora) => Promise<T>} fn Step handler
 *
 * @returns {Promise<T>}
 */
export const runStep = async (message, fn) => {
  const loader = logger.loader(message);

  try {
    const response = await fn(loader);

    return response;
  } catch (err) {
    if (loader.isSpinning) {
      loader.fail(message);
    }

    throw err;
  }
};


/**
 * Marks a step as successful and briefly pauses for UX readability.
 *
 * @param {import('ora').Ora} loader
 * @param {string} message
 */
export const succeedStep = async (loader, message) => {
  loader.succeed(message);

  await sleep(300);
};

/**
 * Marks a step as failed and briefly pauses for UX readability.
 *
 * @param {import('ora').Ora} loader
 * @param {string} message
 */
export const failStep = async (loader, message) => {
  loader.fail(message);

  await sleep(300);
};
