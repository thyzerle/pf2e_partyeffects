import { MODULE_NAME } from './globals.ts';

function log(message: string, ...args: any[]) {
  console.info(`${MODULE_NAME} | ${message}`, ...args);
}

function isGMOnline(): boolean {
  return game.users.find((u) => u.isGM && u.active) !== undefined;
}

export { log, isGMOnline };
