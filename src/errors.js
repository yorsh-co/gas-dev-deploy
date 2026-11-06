// @ts-check

/** An expected failure; the CLI prints its message without a stack trace. */
export class DeployError extends Error {
  /** @param {string} message @param {ErrorOptions} [options] */
  constructor(message, options) {
    super(message, options);
    this.name = 'DeployError';
  }
}

/** The user cancelled a prompt (Ctrl+C). */
export class CancelledError extends Error {
  constructor() {
    super('Cancelled.');
    this.name = 'CancelledError';
  }
}
