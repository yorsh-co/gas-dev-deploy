/**
 * Delays execution for the specified duration.
 *
 * @param {number} [ms=300]
 *
 * @returns {Promise<void>}
 */
export const sleep = (ms = 300) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
