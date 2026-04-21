type LogMethod = (...args: unknown[]) => void;

function noop(): void {}

const debugMethod: LogMethod = import.meta.env.DEV ? console.log.bind(console) : noop;
const infoMethod: LogMethod = console.info.bind(console);
const warnMethod: LogMethod = console.warn.bind(console);
const errorMethod: LogMethod = console.error.bind(console);

export const logger = {
  debug: debugMethod,
  info: infoMethod,
  warn: warnMethod,
  error: errorMethod,
};
