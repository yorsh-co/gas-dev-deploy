/** An expected failure; throw it from a step to fail the deployment cleanly. */
export class DeployError extends Error {
  constructor(message: string, options?: ErrorOptions);
}
