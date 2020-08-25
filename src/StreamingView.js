import Emulator from './components/emulator/emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RoundTripTimeMonitor from './components/emulator/round_trip_time_monitor';
import StreamingController from './StreamingController';
import url from 'url';
import io from 'socket.io-client';
import Log from './Log';
/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */
export default class StreamingView extends Component {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
    edgeNodeId: PropTypes.string.isRequired,
    enableControl: PropTypes.bool,
    enableFullScreen: PropTypes.bool,
    screenOrientation: PropTypes.oneOf(['portrait', 'landscape']),
    view: PropTypes.oneOf(['webrtc', 'png']),
    volume: PropTypes.number, // Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100%
  };

  constructor(props) {
    super(props);
    this.state = {
      isReadyStream: undefined,
      streamEndpoint: undefined,
      maxRetryCount: 120,
      isMuted: true,
    };

    StreamingController({
      apiEndpoint: props.apiEndpoint,
      edgeNodeId: props.edgeNodeId,
      maxRetryCount: this.state.maxRetryCount,
    })
      .then((controller) => {
        const streamEndpoint = controller.getStreamEndpoint();
        const endpoint = url.parse(streamEndpoint);
        this.streamSocket = io(`${endpoint.protocol}//${endpoint.host}`, {
          path: `${endpoint.path}/emulator-commands/socket.io`,
        });
        this.log = new Log(this.streamSocket);

        this.setState({
          isReadyStream: true,
          streamEndpoint: streamEndpoint,
        });
      })
      .catch(() => {
        this.setState({
          isReadyStream: false,
        });
      });

    console.log('Latest update: 2020-08-19 12:20');
  }

  handleUserInteraction = () => {
    if (this.state.isReadyStream && this.state.isMuted) {
      this.log.message('AudioStateChange', 'Unmuted');
    }
    this.setState({ isMuted: false });
  };

  componentWillUnmount() {
    if (this.streamSocket) {
      this.streamSocket.close();
    }
  }

  render() {
    const { enableControl, enableFullScreen, screenOrientation, view, volume } = this.props;

    switch (this.state.isReadyStream) {
      case true:
        return (
          <div>
            <RoundTripTimeMonitor streamSocket={this.streamSocket} />
            <Emulator
              uri={this.state.streamEndpoint}
              log={this.log}
              enableControl={enableControl}
              enableFullScreen={enableFullScreen}
              screenOrientation={screenOrientation}
              view={view}
              muted={this.state.isMuted}
              volume={volume}
              onUserInteraction={this.handleUserInteraction}
              poll={true}
            />
          </div>
        );
      case false:
        return <p>EdgeNode Stream is unreachable</p>;
      default:
        return this.props.children;
    }
  }
}
