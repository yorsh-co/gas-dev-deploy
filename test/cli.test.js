// @ts-check
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import pkg from '../package.json' with { type: 'json' };

const BIN = new URL('../bin/gas-dev-deploy.js', import.meta.url).pathname;

/** @param {string[]} args */
function run(args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
}

describe('gas-dev-deploy CLI', () => {
  it.each(['--help', '-h'])('%s prints usage and exits 0', (flag) => {
    const result = run([flag]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage: gas-dev-deploy');
  });

  it('--version prints the package version', () => {
    const result = run(['--version']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(pkg.version);
  });

  it.each([
    [['--bogus'], /Unknown option '--bogus'/],
    [['extra'], /Unexpected argument 'extra'/],
    [['--version=1'], /does not take an argument/],
  ])('exits 2 with a hint on invalid usage %j', (args, message) => {
    const result = run(args);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/^gas-dev-deploy: /);
    expect(result.stderr).toMatch(message);
    expect(result.stderr).toContain('Run gas-dev-deploy --help for usage.');
  });

  it('exits 1 with a prefixed message on a known failure', () => {
    const result = run([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('gas-dev-deploy: Not implemented.\n');
  });
});
