import Emulator from './components/emulator/emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RoundTripTimeMonitor from './components/emulator/round_trip_time_monitor'
import rp from 'request-promise';

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
  };

  constructor(props) {
    super(props);

    this.state = {
      isReadyStream: undefined,
      maxRetryCount: 120,
    };

    const { apiEndpoint, edgeNodeId } = props;
    this.pollStreamStatus(apiEndpoint, edgeNodeId, this.state.maxRetryCount);
  }

  pollStreamStatus(apiEndpoint, edgeNodeId, maxRetry) {
    console.log('Fetching from:', `${apiEndpoint}/api/streaming-games/status/${edgeNodeId}`);
    rp.get({
      uri: `${apiEndpoint}/api/streaming-games/status/${edgeNodeId}`,
      json: true,
    })
      .then((result) => {
        console.log('Request promise result:', result);
        if (result.state === 'ready') {
          console.log("Edge Node Stream is 'ready'!");
          console.log('Latest update: 2020-07-30 16:20');

          this.setState({
            isReadyStream: true,
          });
        } else if (maxRetry) {
          setTimeout(() => this.pollStreamStatus(apiEndpoint, edgeNodeId, maxRetry - 1), 1000);
        } else {
          this.setState({
            isReadyStream: false,
          });
        }
      })
      .catch((err) => {
        console.log('Request promise error:', err);
      });
  }

  renderEmulatorBlock() {
    const { apiEndpoint, edgeNodeId, enableControl, enableFullScreen, screenOrientation, view } = this.props;

    switch (this.state.isReadyStream) {
      case true:
        return (
          <Emulator
            uri={`${apiEndpoint}/${edgeNodeId}`}
            enableControl={enableControl}
            enableFullScreen={enableFullScreen}
            screenOrientation={screenOrientation}
            view={view}
          />
        );
      case false:
        return <p>EdgeNode Stream is unreachable</p>;
      default:
        return this.props.children;
    }
  }

  render() {
    return (
      <div>
        <RoundTripTimeMonitor endpoint={this.props.apiEndpoint} edgeNodeId={`${this.props.edgeNodeId}`}/>
        {this.renderEmulatorBlock()}
      </div>
    );
  }
}
