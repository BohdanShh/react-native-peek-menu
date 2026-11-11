import chalk from 'chalk';

export const logError = (...text: string[]) => {
  console.log(chalk.white.bgRed(' ERROR: '), chalk.red(...text));
};

export const logSuccess = (...text: string[]) => {
  console.log(chalk.white.bgGreen(' SUCCESS: '), chalk.green(...text));
};
