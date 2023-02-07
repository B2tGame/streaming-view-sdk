import StreamingView from './controllers/StreamingView';
import StreamingController from './controllers/StreamingController';
import StreamingEvent from './controllers/StreamingEvent';
import buildInfo from './controllers/build-info.json';
import defaults from './measurements/defaults';

window && ((window as any).applandStreamingSdkVersion = buildInfo.tag);

/**
 * Streaming View SDK
 */
export { StreamingView, StreamingController, StreamingEvent, defaults };
