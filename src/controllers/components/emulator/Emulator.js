import PropTypes from 'prop-types';
import React, { Component } from 'react';
import EmulatorPngView from './views/EmulatorPngView.js';
import EmulatorWebrtcView from './views/EmulatorWebrtcView.js';
import EventHandler from './views/EventHandler';
import JsepProtocol from './net/JsepProtocol.js';
import * as Proto from '../../proto/emulator_controller_pb';
import { RtcService, EmulatorControllerService } from '../../proto/emulator_web_client';
import StreamingEvent from '../../StreamingEvent';

/**
 * A React component that displays a remote android emulator.
 *
 * The emulator will mount a png or webrtc view component to display the current state
 * of the emulator. It will translate mouse events on this component and send them
 * to the actual emulator.
 *
 * #### Authentication Service
 *
 * The authentication service should implement the following methods:
 *
 * - `authHeader()` which must return a set of headers that should be send along with a request.
 * - `unauthorized()` a function that gets called when a 401 was received.
 *
 * #### Type of view
 *
 * You usually want this to be webrtc as this will make use of the efficient
 * webrtc implementation. The png view will request screenshots, which are
 * very slow, and require the envoy proxy. You should not use this for remote emulators.
 *
 * Note that chrome will not autoplay the video if it is not muted and no interaction
 * with the page has taken place. See https://developers.google.com/web/updates/2017/09/autoplay-policy-changes.
 *
 * #### Pressing hardware buttons
 *
 * This component has a method `sendKey` to sends a key to the emulator.
 * You can use this to send physical hardwar events to the emulator for example:
 *
 * "AudioVolumeDown" -  Decreases the audio volume.
 * "AudioVolumeUp"   -  Increases the audio volume.
 * "Power"           -  The Power button or key, turn off the device.
 * "AppSwitch"       -  Should bring up the application switcher dialog.
 * "GoHome"          -  Go to the home screen.
 * "GoBack"          -  Open the previous screen you were looking at.
 */

class Emulator extends Component {
  /**
   * The minimum amount time the SDK should wait before doing a hard reload due to bad/none functional stream.
   * Consider the time needed after it has been reloaded, it will need some time to do a reconnection etc.
   * @return {number}
   */
  static get RELOAD_HOLD_OFF_TIMEOUT() {
    return 10000;
  }

  /**
   * The minimum amount time the SDK should wait (after a onConnect event) before doing a hard reload due to bad/none functional stream.
   * Consider the time needed after it has been reloaded, it will need some time to do a reconnection etc.
   * @return {number}
   */
  static get RELOAD_HOLD_OFF_TIMEOUT_AFTER_CONNECT() {
    return 5000;
  }

  /**
   * Number of times the system should reload the stream before entering an unreachable state.
   * @return {number}
   */
  static get RELOAD_FAILURE_THRESHOLD() {
    return 2;
  }

  static propTypes = {
    /** gRPC Endpoint where we can reach the emulator. */
    uri: PropTypes.string.isRequired,
    /** Override the default uri for turn servers */
    turnEndpoint: PropTypes.string,
    /** Streaming Edge node ID */
    edgeNodeId: PropTypes.string.isRequired,
    /** The authentication service to use, or null for no authentication. */
    auth: PropTypes.object,
    /** Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100% */
    volume: PropTypes.number,
    /** Audio is muted or enabled (un-muted) */
    muted: PropTypes.bool,
    /** The underlying view used to display the emulator, one of ["webrtc", "png"] */
    view: PropTypes.oneOf(['webrtc', 'png']),
    /** True if polling should be used, only set this to true if you are using the go webgrpc proxy. */
    poll: PropTypes.bool,
    /** True if the fullscreen should be enabled. */
    enableFullScreen: PropTypes.bool,
    /** Enable or disable user interactions with the game */
    enableControl: PropTypes.bool,
    /** Event Logger */
    logger: PropTypes.object.isRequired,
    /** Override the default threshold for now many time the SDK will try to reconnect to the stream */
    maxConnectionRetries: PropTypes.number,
    /** Emulator Width */
    emulatorWidth: PropTypes.number,
    /** Emulator Height */
    emulatorHeight: PropTypes.number,
    /** Emulator Version */
    emulatorVersion: PropTypes.string,
    /** Defines if touch rtt should be measured */
    measureTouchRtt: PropTypes.bool,
    /** Playout Delay Hint */
    playoutDelayHint: PropTypes.number,
    /** Ice Server Candidates */
    iceServers: PropTypes.object,
    /** Max quantization for VP8, max value is 63 */
    vp8MaxQuantization: PropTypes.number,
  };

  static defaultProps = {
    auth: null,
    poll: false,
    maxConnectionRetries: Emulator.RELOAD_FAILURE_THRESHOLD,
    measureTouchRtt: true,
  };

  components = {
    webrtc: EmulatorWebrtcView,
    png: EmulatorPngView,
  };

  state = {
    streamingConnectionId: Date.now(),
    width: undefined,
    height: undefined,
  };

  constructor(props) {
    super(props);

    this.isMountedInView = false;
    this.view = React.createRef();
    this.reloadCount = 0;
    this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT;

    const { uri, auth, poll } = this.props;
    this.emulator = new EmulatorControllerService(uri, auth, this.onError);
    this.rtc = new RtcService(uri, auth, this.onError);
    this.jsep = new JsepProtocol(
      this.emulator,
      this.rtc,
      poll,
      this.props.edgeNodeId,
      this.props.logger,
      this.props.turnEndpoint,
      this.props.playoutDelayHint,
      this.props.iceServers,
      this.props.vp8MaxQuantization
    );

    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .on(StreamingEvent.STREAM_VIDEO_UNAVAILABLE, this.onVideoUnavailable)
      .on(StreamingEvent.STREAM_VIDEO_MISSING, this.onVideoMissing)
      .on(StreamingEvent.STREAM_CONNECTED, this.onConnect);
  }

  componentDidMount() {
    this.isMountedInView = true;
  }

  componentWillUnmount() {
    this.isMountedInView = false;
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .off(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .off(StreamingEvent.STREAM_VIDEO_UNAVAILABLE, this.onVideoUnavailable)
      .off(StreamingEvent.STREAM_VIDEO_MISSING, this.onVideoMissing)
      .off(StreamingEvent.STREAM_CONNECTED, this.onConnect);
  }

  onDisconnect = () => {
    setTimeout(() => {
      this.reload(StreamingEvent.STREAM_DISCONNECTED);
    }, 250);
  };

  onVideoUnavailable = () => {
    setTimeout(() => {
      this.reload(StreamingEvent.STREAM_VIDEO_UNAVAILABLE);
    }, 250);
  };

  onVideoMissing = () => {
    this.reload(StreamingEvent.STREAM_VIDEO_MISSING);
  };

  onConnect = () => {
    this.reloadCount = 0;
    this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT_AFTER_CONNECT;
  };

  /**
   * Sends the given key to the emulator.
   *
   * You can use this to send physical hardware events to the emulator for example:
   *
   * "AudioVolumeDown" -  Decreases the audio volume.
   * "AudioVolumeUp"   -  Increases the audio volume.
   * "Power"           -  The Power button or key, turn off the device.
   * "AppSwitch"       -  Should bring up the application switcher dialog.
   * "GoHome"          -  Go to the home screen.
   * "GoBack"          -  Open the previous screen you were looking at.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values for
   * a list of valid values.
   */
  sendKey = (key) => {
    const request = new Proto.KeyboardEvent();
    request.setEventtype(Proto.KeyboardEvent.KeyEventType.KEYPRESS);
    request.setKey(key);
    this.jsep.send('keyboard', request);
  };

  /**
   *
   * @param {string} cause
   */
  reload(cause) {
    this.props.logger.info('stream not working, request reload');
    if ((this.reloadHoldOff || 0) < Date.now() && this.isMountedInView) {
      this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT;
      if (this.reloadCount >= this.props.maxConnectionRetries) {
        this.props.logger.info(`reload count: ${this.reloadCount} of ${this.props.maxConnectionRetries}`);
        // Give up and exit the stream.
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(
          StreamingEvent.STREAM_UNREACHABLE,
          `Reached max number of reload tries: ${this.reloadCount}`
        );
      } else {
        this.reloadCount++;
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_RELOADED, cause);
        this.setState({ streamingConnectionId: Date.now() });
      }
    }
  }

  render() {
    const {
      view,
      poll,
      volume,
      muted,
      enableFullScreen,
      enableControl,
      uri,
      emulatorWidth,
      emulatorHeight,
      emulatorVersion,
      logger,
      edgeNodeId,
      measureTouchRtt,
    } = this.props;
    return (
      <EventHandler
        key={this.state.streamingConnectionId}
        ref={this.view}
        emulatorWidth={emulatorWidth}
        emulatorHeight={emulatorHeight}
        emulatorVersion={emulatorVersion}
        uri={uri}
        emulator={this.emulator}
        jsep={this.jsep}
        poll={poll}
        volume={volume}
        muted={muted}
        onAudioStateChange={this.onAudioStateChange}
        enableFullScreen={enableFullScreen}
        enableControl={enableControl}
        logger={logger}
        edgeNodeId={edgeNodeId}
        measureTouchRtt={measureTouchRtt}
        view={this.components[view] || EmulatorWebrtcView}
      />
    );
  }
}

export default Emulator;
