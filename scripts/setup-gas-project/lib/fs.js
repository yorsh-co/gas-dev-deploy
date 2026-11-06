import fs from 'fs';

import { logger } from '../ui/logger.js';

export const readJson = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

export const writeJson = (filePath, data) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);

    logger.warn(`Deleted existing ${filePath}`);
  }
};
