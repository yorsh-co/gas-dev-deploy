import chalk from 'chalk';
import ora from 'ora';

const DIVIDER = '───────────────────────────────────────────────────────';
const BOX_WIDTH = 62;

const write = (message = '') => {
  process.stdout.write(`${message}\n`);
};

function writeError(message = '') {
  process.stderr.write(`${message}\n`);
}

export const logger = {
  newline() {
    write('');
  },

  raw(msg = '') {
    write(msg);
  },

  info(msg) {
    write(chalk.cyan(`\n→ ${msg}`));
  },

  muted(msg) {
    write(chalk.gray(msg));
  },

  success(msg) {
    write(chalk.green(`✓ ${msg}`));
  },

  warn(msg) {
    writeError(chalk.yellow(`⚠ ${msg}`));
  },

  error(msg) {
    writeError(chalk.red(`✖ ${msg}`));
  },

  highlight(msg) {
    write(chalk.green(msg));
  },

  divider() {
    write(chalk.gray(DIVIDER));
  },

  /**
   * @param {string} msg Loader message.
   * @returns {import('ora').Ora}
   */
  loader(msg) {
    return ora({
      text: msg,
      color: 'cyan',
    }).start();
  },

  section(title, content) {
    write(
      chalk.bold.green(`
${DIVIDER}
${title.toUpperCase()}
${DIVIDER}
`),
    );

    if (content) write(chalk.green(content));
  },

  block(title, content) {
    const border = '═'.repeat(BOX_WIDTH);

    const paddedTitle = ` ${title} `;

    write(
      chalk.yellow(`
╔${border}╗
║${paddedTitle.padEnd(BOX_WIDTH)}║
╚${border}╝
`),
    );

    if (content) write(chalk.yellow(content));
  },

  banner(lines = []) {
    const border = '═'.repeat(BOX_WIDTH);

    const formattedLines = lines
      .map((line) => {
        const padding = Math.max(0, BOX_WIDTH - line.length);

        const left = Math.floor(padding / 2);

        const right = padding - left;

        return `║${' '.repeat(left)}${line}${' '.repeat(right)}║`;
      })
      .join('\n');

    write(
      chalk.green(`
╔${border}╗
║${' '.repeat(BOX_WIDTH)}║
${formattedLines}
║${' '.repeat(BOX_WIDTH)}║
╚${border}╝
`),
    );
  },
};
