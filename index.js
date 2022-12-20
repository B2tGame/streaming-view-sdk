import StreamingView from './src/controllers/StreamingView';
import StreamingController from './src/controllers/StreamingController';
import StreamingEvent from './src/controllers/StreamingEvent';
import buildInfo from './src/controllers/build-info.json';
import defaults from './src/measurements/defaults';

(window || {}).applandStreamingSdkVersion = buildInfo.tag;

/**
 * Streaming View SDK
 */
export { StreamingView, StreamingController, StreamingEvent, defaults };
