import chalk from 'chalk';

const animation = {
  interval: 80,
  frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};

export const loader = (message: string) => {
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(
      chalk.white.bgBlue('\r INFO: ') + chalk.blue(` ${animation.frames[i]} ${message}`),
    );
    i = (i + 1) % animation.frames.length;
  }, animation.interval);

  return interval;
};
