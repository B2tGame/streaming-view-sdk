import StreamingEvent from './StreamingEvent';

/**
 * @param {string} type The type must be "log", "info", "warn" or "error"
 */
const logFactory =
  (type) =>
  (...args) => {
    if (type === 'error' || type === 'warn') {
      console[type]('Streaming SDK:', ...args);
    }
    StreamingEvent.emit(StreamingEvent.LOG, { type, data: args });
  };

export default {
  info: logFactory('info'),
  warn: logFactory('warn'),
  error: logFactory('error'),
};
