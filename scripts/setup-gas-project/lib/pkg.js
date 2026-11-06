import { PATHS } from '../config/paths.js';
import { readJson } from './fs.js';

export const loadPkg = () => readJson(PATHS.pkg);
