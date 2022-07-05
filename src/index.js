import StreamingView from './controllers/StreamingView';
import StreamingController from './controllers/StreamingController';
import StreamingEvent from './controllers/StreamingEvent';
import buildInfo from './controllers/build-info.json';

(window || {}).applandStreamingSdkVersion = buildInfo.tag;

/**
 * Streaming View SDK
 */
export { StreamingView, StreamingController, StreamingEvent };
