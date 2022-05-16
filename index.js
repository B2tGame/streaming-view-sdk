import StreamingView from './src/StreamingView';
import StreamingController from './src/StreamingController';
import StreamingEvent from './src/StreamingEvent';
import buildInfo from './src/build-info.json';

(window || {}).applandStreamingSdkVersion = buildInfo.tag;

/**
 * Streaming View SDK
 */
export { StreamingView, StreamingController, StreamingEvent };
