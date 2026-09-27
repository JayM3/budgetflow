import readline from 'readline';

// ANSI escape color helpers
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
  bgDark: '\x1b[48;5;236m',
};

export const c = {
  green: (text) => `${colors.green}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  magenta: (text) => `${colors.magenta}${text}${colors.reset}`,
  dim: (text) => `${colors.dim}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  success: (text) => `${colors.brightGreen}✓ ${text}${colors.reset}`,
  error: (text) => `${colors.brightRed}✗ ${text}${colors.reset}`,
  warning: (text) => `${colors.brightYellow}⚠ ${text}${colors.reset}`,
  info: (text) => `${colors.brightCyan}ℹ ${text}${colors.reset}`,
};

/**
 * Display an ASCII framed banner box
 */
export function printBox(title, lines, borderColor = colors.cyan) {
  const contentWidth = Math.max(
    title ? title.length + 4 : 0,
    ...lines.map(l => stripAnsi(l).length),
    50
  );

  const topBorder = `╔═${'═'.repeat(contentWidth)}═╗`;
  const bottomBorder = `╚═${'═'.repeat(contentWidth)}═╝`;
  const divider = `╠═${'═'.repeat(contentWidth)}═╣`;

  console.log(`${borderColor}${topBorder}${colors.reset}`);
  if (title) {
    const padTotal = contentWidth - stripAnsi(title).length;
    const padLeft = Math.floor(padTotal / 2);
    const padRight = padTotal - padLeft;
    console.log(
      `${borderColor}║${colors.reset} ${' '.repeat(padLeft)}${colors.bold}${title}${colors.reset}${' '.repeat(padRight)} ${borderColor}║${colors.reset}`
    );
    console.log(`${borderColor}${divider}${colors.reset}`);
  }

  for (const line of lines) {
    const rawLen = stripAnsi(line).length;
    const pad = Math.max(0, contentWidth - rawLen);
    console.log(
      `${borderColor}║${colors.reset} ${line}${' '.repeat(pad)} ${borderColor}║${colors.reset}`
    );
  }
  console.log(`${borderColor}${bottomBorder}${colors.reset}`);
}

/**
 * Strip ANSI escape codes to calculate visual string length
 */
export function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Prompt user in terminal (returns Promise<string>)
 */
export function prompt(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Yes / No confirmation prompt
 */
export async function confirm(questionText, defaultYes = false) {
  const suffix = defaultYes ? ' [Y/n]: ' : ' [y/N]: ';
  const ans = await prompt(`${questionText}${suffix}`);
  if (!ans) return defaultYes;
  const lower = ans.toLowerCase();
  return lower === 'y' || lower === 'yes';
}

/**
 * Print a key-value status pair
 */
export function printKV(key, value, indent = 2) {
  const spaces = ' '.repeat(indent);
  const paddedKey = (key + ':').padEnd(22, ' ');
  console.log(`${spaces}${colors.dim}${paddedKey}${colors.reset} ${value}`);
}
