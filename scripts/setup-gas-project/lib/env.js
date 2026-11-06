import fs from 'fs';
import dotenv from 'dotenv';

import { PATHS } from '../config/paths.js';

export const loadEnv = () => {
  if (!fs.existsSync(PATHS.env)) {
    return {};
  }

  return dotenv.parse(fs.readFileSync(PATHS.env));
};

export const updateEnv = (values) => {
  const current = loadEnv();

  const updated = {
    ...current,
    ...values,
  };

  const output = Object.entries(updated)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  fs.writeFileSync(PATHS.env, output + '\n');
};
