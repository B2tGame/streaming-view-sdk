import Emulator from './components/emulator/emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RoundTripTimeMonitor from './components/emulator/round_trip_time_monitor';
import RtcReportHandler from './components/emulator/net/rtc_report_handler';
import StreamingController from './StreamingController';
import url from 'url';
import io from 'socket.io-client';
import Log from './Log';
import ConsoleLogger from './ConsoleLogger';
import buildInfo from './build-info.json';

/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */
export default class StreamingView extends Component {
  state = {
    isReadyStream: undefined,
    streamEndpoint: undefined,
    turnEndpoint: undefined,
    isMuted: true,
  };

  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
    edgeNodeId: PropTypes.string.isRequired,
    edgeNodeEndpoint: PropTypes.string,
    turnEndpoint: PropTypes.string,
    userId: PropTypes.string,
    enableControl: PropTypes.bool,
    enableFullScreen: PropTypes.bool,
    view: PropTypes.oneOf(['webrtc', 'png']),
    volume: PropTypes.number, // Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100%
    onEvent: PropTypes.func, // report events during the streaming view.
    streamQualityRating: PropTypes.number,
    enableDebug: PropTypes.bool,
    internalSession: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.rtcReportHandler = new RtcReportHandler();
    this.consoleLogger = new ConsoleLogger(props.enableDebug);
    const { apiEndpoint, edgeNodeId, userId } = this.props;
    this.isMountedInView = false;
    StreamingController({
      apiEndpoint: apiEndpoint,
      edgeNodeId: edgeNodeId,
      onEvent: this.props.onEvent,
    })
      .then((controller) => controller.getStreamEndpoint())
      .then((streamEndpoint) => {
        // if the SDK are in internal session mode and a value has been pass to edge node endpoint use that value insted of the
        // public endpoint received from Service Coordinator.
        return this.props.internalSession && this.props.edgeNodeEndpoint ? this.props.edgeNodeEndpoint : streamEndpoint;
      })
      .then((streamEndpoint) => {
        if (!this.isMountedInView) {
          this.consoleLogger.log('Cancel action due to view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        const endpoint = url.parse(streamEndpoint);
        this.streamSocket = io(`${endpoint.protocol}//${endpoint.host}`, {
          path: `${endpoint.path}/emulator-commands/socket.io`,
          query: `userId=${userId}&internal=${this.props.internalSession ? '1' : '0'}`,
        });
        this.log = new Log(this.streamSocket);
        this.setState({
          isReadyStream: true,
          streamEndpoint: streamEndpoint,
          turnEndpoint: this.props.internalSession && this.props.turnEndpoint ? this.props.turnEndpoint : undefined
        });
        this.logEnableControlState();
      })
      .catch((err) => {
        if (!this.isMountedInView) {
          this.consoleLogger.log('Cancel action due to view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        this.log && this.log.error(err);
        this.consoleLogger.error('StreamingController Errors: ', err);
        this.setState({
          isReadyStream: false,
        });
      });
    this.consoleLogger.log(`Latest update: ${buildInfo.tag}`);
  }

  handleUserInteraction = () => {
    if (this.state.isReadyStream && this.state.isMuted) {
      this.log.state('audio-state-change', 'unmuted');
    }

    if (this.state.isMuted) {
      this.setState({ isMuted: false });
    }
  };

  componentWillUnmount() {
    this.isMountedInView = false;
    if (this.streamSocket) {
      this.streamSocket.close();
    }
  }

  componentDidMount() {
    this.isMountedInView = true;
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.streamQualityRating !== nextProps.streamQualityRating) {
      this.addRatingToMetric(nextProps.streamQualityRating);
    }

    // Don't re-render component when rating was changed
    return this.props.streamQualityRating === nextProps.streamQualityRating;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.enableControl !== prevProps.enableControl) {
      this.logEnableControlState();
    }
  }

  addRatingToMetric = (rating) => {
    this.rtcReportHandler.emit('STREAM_QUALITY_RATING', { streamQualityRating: rating });
  };

  logEnableControlState() {
    this.log && this.log.state('user-control-state-change', this.props.enableControl ? 'player' : 'watcher');
  }

  render() {
    const { enableControl, enableFullScreen, view, volume } = this.props;

    switch (this.state.isReadyStream) {
      case true:
        return (
          <div>
            <RoundTripTimeMonitor
              streamSocket={this.streamSocket}
              rtcReportHandler={this.rtcReportHandler}
              consoleLogger={this.consoleLogger}
            />
            <Emulator
              uri={this.state.streamEndpoint}
              turnEndpoint={this.state.turnEndpoint}
              log={this.log}
              enableControl={enableControl}
              enableFullScreen={enableFullScreen}
              view={view}
              muted={this.state.isMuted}
              volume={volume}
              onUserInteraction={this.handleUserInteraction}
              poll={true}
              rtcReportHandler={this.rtcReportHandler}
              consoleLogger={this.consoleLogger}
              onEvent={this.props.onEvent}
            />
          </div>
        );
      case false:
        return <p style={{ color: 'white' }}>EdgeNode Stream is unreachable</p>;
      default:
        return this.props.children;
    }
  }
}
