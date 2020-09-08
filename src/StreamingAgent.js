import { Component } from 'react';
import PropTypes from 'prop-types';

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
