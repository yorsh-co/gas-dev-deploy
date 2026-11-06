import { DeployError } from '../../../src/index.js';

export default [
  {
    title: 'Clean failure',
    async run() {
      throw new DeployError('token rejected');
    },
  },
];
