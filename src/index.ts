import StreamingView from './controllers/StreamingView.js';
import StreamingController from './controllers/StreamingController.js';
import * as StreamingEvent from './controllers/StreamingEvent.js';
import buildInfo from './controllers/build-info.json';
import defaults from './measurements/defaults.js';

if (typeof window !== 'undefined') {
  window.applandStreamingSdkVersion = buildInfo.tag;
}

/**
 * Streaming View SDK
 */
export { StreamingView, StreamingController, StreamingEvent, defaults };
