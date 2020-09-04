import Emulator from './components/emulator/emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RoundTripTimeMonitor from './components/emulator/round_trip_time_monitor';
import StreamingController from './StreamingController';
import url from 'url';
import io from 'socket.io-client';
import Log from './Log';

/**
 * StreamingAgent class is responsible to running any nesureary background task for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
export default class StreamingAgent extends Component {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // When needed we should implemented required logic that can be setup and running in the background of the users session.
    // Example of use cases is to doing RTT measurement against multiple edge nodes for get average RTT and find the
    // fasted region that should be used.
  }

  componentWillUnmount() {
    // Any background action that has been started should be stopped now.
  }

  render() {
    return null;
  }
}
