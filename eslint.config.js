import { gasEslint } from 'gas-dev-config/eslint';

// `scripts/` is the legacy wizard; removed once src/ replaces it.
export default [{ ignores: ['scripts/'] }, ...gasEslint({ preset: 'node' })];
