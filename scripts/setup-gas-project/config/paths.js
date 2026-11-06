import path from 'path';

export const ROOT = process.cwd();

export const PATHS = {
  env: path.join(ROOT, '.env'),
  pkg: path.join(ROOT, 'package.json'),
  clasp: path.join(ROOT, '.clasp.json'),
  claspExample: path.join(ROOT, '.clasp.example.json'),
  manifest: path.join(ROOT, 'appsscript.json'),
  manifestExample: path.join(ROOT, 'appsscript.example.json'),
  src: path.join(ROOT, 'src'),
};
