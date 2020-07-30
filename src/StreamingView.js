import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EmulatorScreen from './components/emulator_screen';
import { EmulatorControllerService } from './components/emulator/net/emulator_web_client';
import RoundTripTimeMonitor from './components/round_trip_time_monitor';

const rp = require('request-promise');
const url = require('url');

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
  };

  constructor(props) {
    super(props);

    this.state = {
      isReadyStream: undefined,
      maxRetryCount: 120,
    };

    const { apiEndpoint, edgeNodeId } = props;
    this.emulator = new EmulatorControllerService(`${apiEndpoint}/${edgeNodeId}`);
    this.turnHost = url.parse(apiEndpoint).hostname || window.location.hostname;
    this.pollStreamStatus(apiEndpoint, edgeNodeId, this.state.maxRetryCount);
  }

  pollStreamStatus(apiEndpoint, edgeNodeId, maxRetry) {
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
    switch (this.state.isReadyStream) {
      case true:
        const { enableControl, enableFullScreen } = this.props;
        return (
          <EmulatorScreen
            emulator={this.emulator}
            enableControl={enableControl}
            enableFullScreen={enableFullScreen}
            turnHost={this.turnHost}
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
        <RoundTripTimeMonitor />
        {this.renderEmulatorBlock()}
      </div>
    );
  }
}
