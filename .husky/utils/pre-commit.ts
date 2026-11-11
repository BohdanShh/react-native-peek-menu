import chalk from 'chalk';
import { exec } from 'child_process';

import { logError, logSuccess } from './colorful-logs';
import { emptyLine } from './empty-line';
import { loader } from './loader';

const parseTypescriptErrors = (output: string) => {
  const errorLines = output.split('\n');
  const errors: string[] = [];

  for (const line of errorLines) {
    const pattern = /(.+)\((\d+),(\d+)\): error (.+)/;
    const match = line.match(pattern);

    if (match) {
      const filePath = match[1];
      const lineNumber = match[2];
      const columnNumber = match[3];
      const errorMessage = match[4].replace(/TS\d+:\s*/g, '');

      const numbers = chalk.dim(`${chalk.dim(lineNumber)}:${chalk.dim(columnNumber)}`);
      const error = `${chalk.underline(filePath)}\n    ${numbers}  ${chalk.red('error')}  ${errorMessage}\n`;

      errors.push(error);
    }
  }

  return errors;
};

const validateTypes = async () => {
  return new Promise<void>((resolve, reject) => {
    const loaderInterval = loader('Running type checking');

    exec('bun run types', (error, stdout) => {
      clearInterval(loaderInterval);
      emptyLine();

      if (error) {
        console.log(chalk.red('✖ bun run types\n'));

        const errors = parseTypescriptErrors(stdout);

        if (errors.length > 0) {
          errors.forEach((err) => console.log(err));
        }

        reject(new Error(`❌ You've got ${errors.length} TS errors\n`));
      } else {
        logSuccess('Type validation successful, no errors found 🚀');
        resolve();
      }
    });
  });
};

const validateCodeStyle = async () => {
  return new Promise<void>((resolve, reject) => {
    const loaderInterval = loader('Checking code style');

    exec('bunx lint-staged', (error, _stdout, stderr) => {
      clearInterval(loaderInterval);
      emptyLine();

      if (error) {
        if (stderr) {
          console.log(stderr);
        }

        reject(new Error('Code style is out of order 😢\n'));
      } else {
        logSuccess('Code style is great 👍');
        resolve();
      }
    });
  });
};

const runPreCommitScripts = async () => {
  try {
    await validateTypes();
    await validateCodeStyle();
  } catch (error) {
    if (error instanceof Error) {
      logError(error.message);
    }
    process.exit(1);
  }
};

runPreCommitScripts();
