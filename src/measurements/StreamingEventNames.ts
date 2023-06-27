import { ClassificationReport } from '../controllers/service/Classification';
import { EmulatorConfiguration } from '../controllers/service/StreamSocket';
import { Measurement } from './service/networkConnectivity';

// Event of log with payload {type: string, data: []*}
export const LOG = 'log';
export type LOG_PAYLOAD = [{ type?: 'info' | 'warn' | 'error'; name?: string; action?: string; data?: any[] }];

// Error event with an exception as payload
export const ERROR = 'error';
export type ERROR_PAYLOAD = unknown[];

// StreamSocket error
export const SOCKET_ERROR = 'socket-error';
export type SOCKET_ERROR_PAYLOAD = unknown[];

// Event fired when browser error occurs
export const ERROR_BROWSER = 'error-browser';
export type ERROR_BROWSER_PAYLOAD = unknown[];

// Event fired when a touch or click has started
export const TOUCH_START = 'touch-start';
export type TOUCH_START_PAYLOAD = [{ x: number; y: number }];

// Event fired when a touch or click has ended
export const TOUCH_END = 'touch-end';
export type TOUCH_END_PAYLOAD = [{ x: number; y: number }];

// Event fired when a new RTT value based on a touch has been detected
export const TOUCH_RTT = 'touch-rtt';
export type TOUCH_RTT_PAYLOAD = unknown[];

// Event fired when a touch rtt times out
export const TOUCH_RTT_TIMEOUT = 'touch-rtt-timeout';
export type TOUCH_RTT_TIMEOUT_PAYLOAD = unknown[];

// Event that is fire when the SDK receiving the edge node are ready to accept a connection.
export const EDGE_NODE_READY_TO_ACCEPT_CONNECTION = 'edge-node-ready-to-accept-connection';
export type EDGE_NODE_READY_TO_ACCEPT_CONNECTION_PAYLOAD = unknown[];

// Web RTC measurement with payload created from {RTCPeerConnection.getStats}
export const WEB_RTC_MEASUREMENT = 'web-rtc-measurement';
export type WEB_RTC_MEASUREMENT_PAYLOAD = [
  {
    stats: RTCStatsReport;
    synchronizationSource?: {
      timestamp: number;
      rtpTimestamp: number;
    };
    frameTimestamps: number[];
  }
];
// {
//   stats,
//   synchronizationSource,
//   frameTimestamps,
// }

// Event requesting Web RTC measurement from {RTCPeerConnection.getStats}
export const REQUEST_WEB_RTC_MEASUREMENT = 'request-web-rtc-measurement';
export type REQUEST_WEB_RTC_MEASUREMENT_PAYLOAD = never[];

// Event of network RTT with payload {number} in millisecond
export const ROUND_TRIP_TIME_MEASUREMENT = 'round-trip-time-measurement';
export type ROUND_TRIP_TIME_MEASUREMENT_PAYLOAD = unknown[];

// time offset
export const TIME_OFFSET_MEASUREMENT = 'time-offset-measurement';
export type TIME_OFFSET_MEASUREMENT_PAYLOAD = [number];

// Event of webrtc client connected
export const WEBRTC_CLIENT_CONNECTED = 'webrtc-client-connected';
export type WEBRTC_CLIENT_CONNECTED_PAYLOAD = unknown[];

// Event of webrtc RTT with payload {number} in millisecond
export const WEBRTC_ROUND_TRIP_TIME_MEASUREMENT = 'webrtc-round-trip-time-measurement';
export type WEBRTC_ROUND_TRIP_TIME_MEASUREMENT_PAYLOAD = [number];

// Final report that should be sent up to the backend with a report of all measurement
export const REPORT_MEASUREMENT = 'report-measurement';
export type REPORT_MEASUREMENT_PAYLOAD = [{ networkRoundTripTime: number; extra: Measurement }];

// Event fired when the current location/data center has no free allocations for this edge node
// and result in the edge node is queued until required capacity in the datacenter is available.
export const SERVER_OUT_OF_CAPACITY = 'server-out-of-capacity';
export type SERVER_OUT_OF_CAPACITY_PAYLOAD = unknown[];

// Event fired when the peer connection has been selected and the system know how it is connected to the backend.
export const PEER_CONNECTION_SELECTED = 'peer-connection-selected';
export type PEER_CONNECTION_SELECTED_PAYLOAD = unknown[];

// Event fired when the stream is connected to the backend and the consumer receiving a video stream.
export const STREAM_CONNECTED = 'stream-connected';
export type STREAM_CONNECTED_PAYLOAD = unknown[];

// Event fired when the stream is disconnected from the backend and no video or no audio is available.
export const STREAM_DISCONNECTED = 'stream-disconnected';
export type STREAM_DISCONNECTED_PAYLOAD = never[];

// Event that is fired when the stream enters an unreachable and none recoverable state.
export const STREAM_UNREACHABLE = 'stream-unreachable';
export type STREAM_UNREACHABLE_PAYLOAD = [string];

// Event that is fired when the edge node crashes.
export const EDGE_NODE_CRASHED = 'edge-node-crashed';
export type EDGE_NODE_CRASHED_PAYLOAD = unknown[];

// Backend signal the stream are in progress to be terminated.
export const STREAM_TERMINATED = 'stream-terminated';
export type STREAM_TERMINATED_PAYLOAD = never[];

// Backend signal the stream are paused now.
export const STREAM_PAUSED = 'stream-paused';
export type STREAM_PAUSED_PAYLOAD = never[];

// Backend signal the stream are resumed now.
export const STREAM_RESUMED = 'stream-resumed';
export type STREAM_RESUMED_PAYLOAD = never[];

// Event fired when the stream is reloaded during auto recovery process from an error.
export const STREAM_RELOADED = 'stream-reloaded';
export type STREAM_RELOADED_PAYLOAD = unknown[];

// Event fired when the video stream started playing (resume from paused or started)
export const STREAM_VIDEO_PLAYING = 'stream-video-playing';
export type STREAM_VIDEO_PLAYING_PAYLOAD = unknown[];

// Event fired the event oncanplay is happen on the video DOM element after the tracks has been added.
export const STREAM_VIDEO_CAN_PLAY = 'stream-video-can-play';
export type STREAM_VIDEO_CAN_PLAY_PAYLOAD = unknown[];

// Event fired when the video is available and can be played.
export const STREAM_VIDEO_AVAILABLE = 'stream-video-available';
export type STREAM_VIDEO_AVAILABLE_PAYLOAD = unknown[];

// Event fired when the video is not longer available.
export const STREAM_VIDEO_UNAVAILABLE = 'stream-video-unavailable';
export type STREAM_VIDEO_UNAVAILABLE_PAYLOAD = unknown[];

// Event fired when the video is missing but not certainly unavailable.
export const STREAM_VIDEO_MISSING = 'stream-video-missing';
export type STREAM_VIDEO_MISSING_PAYLOAD = unknown[];

// Event fired when a user interaction is required in order to start video playing
export const REQUIRE_USER_PLAY_INTERACTION = 'require-user-play-interaction';
export type REQUIRE_USER_PLAY_INTERACTION_PAYLOAD = unknown[];

// Event fired when a thumbnail screenshot of the video has been created.
export const STREAM_VIDEO_SCREENSHOT = 'stream-video-screenshot';
export type STREAM_VIDEO_SCREENSHOT_PAYLOAD = [
  {
    hasVideo: boolean;
    captureProcessingTime: number;
    screenshot: string;
    centerPixelColor: string;
  }
];

// Event fires when a black screen occurs on the user viewport
export const STREAM_BLACK_SCREEN = 'stream-black-screen';
export type STREAM_BLACK_SCREEN_PAYLOAD = [{ cause: string }];

// Event fires on first user interaction with audio codec
export const STREAM_AUDIO_CODEC = 'stream-audio-codec';
export type STREAM_AUDIO_CODEC_PAYLOAD = [string];

// Event fires on first user interaction with video codec
export const STREAM_VIDEO_CODEC = 'stream-video-codec';
export type STREAM_VIDEO_CODEC_PAYLOAD = [string];

// Event fired when the user interact with a running stream.
export const USER_INTERACTION = 'user-interaction';
export type USER_INTERACTION_PAYLOAD = unknown[];

// Event fired when receiving emulator configuration during initialization of P2P connection
export const EMULATOR_CONFIGURATION = 'emulator-configuration';
export type EMULATOR_CONFIGURATION_PAYLOAD = [EmulatorConfiguration];

// Event fired for every emulator stage completion.
export const EMULATOR_LOADING_PROGRESS = 'emulator-loading-progress';
export type EMULATOR_LOADING_PROGRESS_PAYLOAD = unknown[];

// Event fired when the stream quality rating has been updated.
export const STREAM_QUALITY_RATING = 'stream-quality-rating';
export type STREAM_QUALITY_RATING_PAYLOAD = [{ streamQualityRating?: number }];

// Event fired when the audio is available and can be un-muted.
export const STREAM_AUDIO_AVAILABLE = 'stream-audio-available';
export type STREAM_AUDIO_AVAILABLE_PAYLOAD = unknown[];

// Event fired when the audio is not longer available.
export const STREAM_AUDIO_UNAVAILABLE = 'stream-audio-unavailable';
export type STREAM_AUDIO_UNAVAILABLE_PAYLOAD = unknown[];

// Event fired when the audio unmute action paused the video
export const STREAM_AUDIO_UNMUTE_ERROR = 'stream-audio-unmute-error';
export type STREAM_AUDIO_UNMUTE_ERROR_PAYLOAD = unknown[];

// Report that should be sent up to the backend from user clicked play until stream video is playing
export const STREAM_LOADING_TIME = 'stream-loading-time';
export type STREAM_LOADING_TIME_PAYLOAD = unknown[];

// Event fired when the webrtc video stream is available and can be played by the browser
export const STREAM_WEBRTC_READY = 'stream-webrtc-ready';
export type STREAM_WEBRTC_READY_PAYLOAD = [() => void];

// Event fired when the emulator is ready and first input lag fix has been applied.
export const STREAM_EMULATOR_READY = 'stream-emulator-ready';
export type STREAM_EMULATOR_READY_PAYLOAD = never[];

// Event fired when the video stream is available and "play" button can be displayed for the end user,
// this will only happen after both STREAM_WEBRTC_READY and STREAM_EMULATOR_READY has been received.
export const STREAM_READY = 'stream-ready';
export type STREAM_READY_PAYLOAD = unknown[];

// Event fired when User Event Report is submitted
export const USER_EVENT_REPORT = 'user-event-report';
export type USER_EVENT_REPORT_PAYLOAD = [{ role: string; eventType: string; value: number | string; message: string }];

// Event fired when the user starts playing the game
export const USER_STARTS_PLAYING = 'user-starts-playing';
export type USER_STARTS_PLAYING_PAYLOAD = unknown[];

// Custom moment event send by moment event detector to SDK.
export const MOMENT_DETECTOR_EVENT = 'moment-detector-event';
export type MOMENT_DETECTOR_EVENT_PAYLOAD = unknown[];

// Event fired many times during a game session after (re)evaluation of the predicted game experience.
export const PREDICTED_GAME_EXPERIENCE = 'predicted-game-experience';
export type PREDICTED_GAME_EXPERIENCE_PAYLOAD = unknown[];

// Event fired when the new edgeWorker is detected by StreamingEvent handler.
export const NEW_EDGE_WORKER = 'new-edge-worker';
export type NEW_EDGE_WORKER_PAYLOAD = unknown[];

// Event fired when the new edge node is detected by StreamingEvent handler.
export const NEW_EDGE_NODE = 'new-edge-node';
export type NEW_EDGE_NODE_PAYLOAD = unknown[];

// Event fired by StreamingEvent when the edge node has been destroyed.
export const DESTROY_EDGE_NODE = 'destroy-edge-node';
export type DESTROY_EDGE_NODE_PAYLOAD = unknown[];

// Event fired at the end of the stream with the collected measurement report
export const CLASSIFICATION_REPORT = 'classification-report';
export type CLASSIFICATION_REPORT_PAYLOAD = [ClassificationReport];

export interface StreamingEventTypes {
  [LOG]: LOG_PAYLOAD;
  [ERROR]: ERROR_PAYLOAD;
  [SOCKET_ERROR]: SOCKET_ERROR_PAYLOAD;
  [ERROR_BROWSER]: ERROR_BROWSER_PAYLOAD;
  [TOUCH_START]: TOUCH_START_PAYLOAD;
  [TOUCH_END]: TOUCH_END_PAYLOAD;
  [TOUCH_RTT]: TOUCH_RTT_PAYLOAD;
  [TOUCH_RTT_TIMEOUT]: TOUCH_RTT_TIMEOUT_PAYLOAD;
  [EDGE_NODE_READY_TO_ACCEPT_CONNECTION]: EDGE_NODE_READY_TO_ACCEPT_CONNECTION_PAYLOAD;
  [WEB_RTC_MEASUREMENT]: WEB_RTC_MEASUREMENT_PAYLOAD;
  [REQUEST_WEB_RTC_MEASUREMENT]: REQUEST_WEB_RTC_MEASUREMENT_PAYLOAD;
  [ROUND_TRIP_TIME_MEASUREMENT]: ROUND_TRIP_TIME_MEASUREMENT_PAYLOAD;
  [TIME_OFFSET_MEASUREMENT]: TIME_OFFSET_MEASUREMENT_PAYLOAD;
  [WEBRTC_CLIENT_CONNECTED]: WEBRTC_CLIENT_CONNECTED_PAYLOAD;
  [WEBRTC_ROUND_TRIP_TIME_MEASUREMENT]: WEBRTC_ROUND_TRIP_TIME_MEASUREMENT_PAYLOAD;
  [REPORT_MEASUREMENT]: REPORT_MEASUREMENT_PAYLOAD;
  [SERVER_OUT_OF_CAPACITY]: SERVER_OUT_OF_CAPACITY_PAYLOAD;
  [PEER_CONNECTION_SELECTED]: PEER_CONNECTION_SELECTED_PAYLOAD;
  [STREAM_CONNECTED]: STREAM_CONNECTED_PAYLOAD;
  [STREAM_DISCONNECTED]: STREAM_DISCONNECTED_PAYLOAD;
  [STREAM_UNREACHABLE]: STREAM_UNREACHABLE_PAYLOAD;
  [EDGE_NODE_CRASHED]: EDGE_NODE_CRASHED_PAYLOAD;
  [STREAM_TERMINATED]: STREAM_TERMINATED_PAYLOAD;
  [STREAM_PAUSED]: STREAM_PAUSED_PAYLOAD;
  [STREAM_RESUMED]: STREAM_RESUMED_PAYLOAD;
  [STREAM_RELOADED]: STREAM_RELOADED_PAYLOAD;
  [STREAM_VIDEO_PLAYING]: STREAM_VIDEO_PLAYING_PAYLOAD;
  [STREAM_VIDEO_CAN_PLAY]: STREAM_VIDEO_CAN_PLAY_PAYLOAD;
  [STREAM_VIDEO_AVAILABLE]: STREAM_VIDEO_AVAILABLE_PAYLOAD;
  [STREAM_VIDEO_UNAVAILABLE]: STREAM_VIDEO_UNAVAILABLE_PAYLOAD;
  [STREAM_VIDEO_MISSING]: STREAM_VIDEO_MISSING_PAYLOAD;
  [REQUIRE_USER_PLAY_INTERACTION]: REQUIRE_USER_PLAY_INTERACTION_PAYLOAD;
  [STREAM_VIDEO_SCREENSHOT]: STREAM_VIDEO_SCREENSHOT_PAYLOAD;
  [STREAM_BLACK_SCREEN]: STREAM_BLACK_SCREEN_PAYLOAD;
  [STREAM_AUDIO_CODEC]: STREAM_AUDIO_CODEC_PAYLOAD;
  [STREAM_VIDEO_CODEC]: STREAM_VIDEO_CODEC_PAYLOAD;
  [USER_INTERACTION]: USER_INTERACTION_PAYLOAD;
  [EMULATOR_CONFIGURATION]: EMULATOR_CONFIGURATION_PAYLOAD;
  [EMULATOR_LOADING_PROGRESS]: EMULATOR_LOADING_PROGRESS_PAYLOAD;
  [STREAM_QUALITY_RATING]: STREAM_QUALITY_RATING_PAYLOAD;
  [STREAM_AUDIO_AVAILABLE]: STREAM_AUDIO_AVAILABLE_PAYLOAD;
  [STREAM_AUDIO_UNAVAILABLE]: STREAM_AUDIO_UNAVAILABLE_PAYLOAD;
  [STREAM_AUDIO_UNMUTE_ERROR]: STREAM_AUDIO_UNMUTE_ERROR_PAYLOAD;
  [STREAM_LOADING_TIME]: STREAM_LOADING_TIME_PAYLOAD;
  [STREAM_WEBRTC_READY]: STREAM_WEBRTC_READY_PAYLOAD;
  [STREAM_EMULATOR_READY]: STREAM_EMULATOR_READY_PAYLOAD;
  [STREAM_READY]: STREAM_READY_PAYLOAD;
  [USER_EVENT_REPORT]: USER_EVENT_REPORT_PAYLOAD;
  [USER_STARTS_PLAYING]: USER_STARTS_PLAYING_PAYLOAD;
  [MOMENT_DETECTOR_EVENT]: MOMENT_DETECTOR_EVENT_PAYLOAD;
  [PREDICTED_GAME_EXPERIENCE]: PREDICTED_GAME_EXPERIENCE_PAYLOAD;
  [NEW_EDGE_WORKER]: NEW_EDGE_WORKER_PAYLOAD;
  [NEW_EDGE_NODE]: NEW_EDGE_NODE_PAYLOAD;
  [DESTROY_EDGE_NODE]: DESTROY_EDGE_NODE_PAYLOAD;

  [CLASSIFICATION_REPORT]: CLASSIFICATION_REPORT_PAYLOAD;
}
