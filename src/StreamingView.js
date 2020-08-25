import Emulator from './components/emulator/emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RoundTripTimeMonitor from './components/emulator/round_trip_time_monitor';
import StreamingController from './StreamingController';
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
      muted: true,
    };

    StreamingController({
      apiEndpoint: props.apiEndpoint,
      edgeNodeId: props.edgeNodeId,
      maxRetryCount: this.state.maxRetryCount,
    }).then((controller) => {
      this.setState({
        isReadyStream: true,
        streamEndpoint: controller.getStreamEndpoint(),
      });
    }).catch((err) => {
      console.log('Error: ', err);
      this.setState({
        isReadyStream: false,
      });
    })

    console.log('Latest update: 2020-08-19 12:20');
  }

  handleUserInteraction = () => {
    this.setState({ muted: false });
  };


  render() {
    const { enableControl, enableFullScreen, screenOrientation, view, volume } = this.props;

    switch (this.state.isReadyStream) {
      case true:
        return (
          <div>
            <RoundTripTimeMonitor endpoint={this.state.streamEndpoint} />
            <Emulator
              uri={this.state.streamEndpoint}
              enableControl={enableControl}
              enableFullScreen={enableFullScreen}
              screenOrientation={screenOrientation}
              view={view}
              muted={this.state.muted}
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
