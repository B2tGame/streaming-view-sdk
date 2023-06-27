import { emit } from './StreamingEvent';
import { LOG } from './StreamingEventNames';

const logFactory =
  (type: 'info' | 'warn' | 'error'): LogFn =>
  (...args: any[]) => {
    if (type === 'error' || type === 'warn') {
      console[type]('Streaming SDK:', ...args);
    }
    emit(LOG, { type, data: args });
  };

type LogFn = (...args: any[]) => void;

export const info = logFactory('info');
export const warn = logFactory('warn');
export const error = logFactory('error');

export type Logger = {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
};
