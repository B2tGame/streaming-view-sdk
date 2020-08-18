import io from 'socket.io-client';
import PropTypes from 'prop-types';
import { Component } from 'react';
import MessageEmitter from './MessageEmitter';

class RoundTripTimeMonitor extends Component {
  static propTypes = {
    /** endpoint Endpoint where we can reach the emulator. */
    endpoint: PropTypes.string.isRequired,
    edgeNodeId: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const socket = io(this.props.endpoint, { path: '/' + this.props.edgeNodeId + '/emulator-commands/socket.io' });

    socket.on('error', (err) => {
      console.log('Round Trip Time Monitor: ', err);
    });

    socket.on('pong', (networkRoundTripTime) => {
      socket.emit(
        'message',
        JSON.stringify({
          type: 'report',
          timestamp: Date.now(),
          networkRoundTripTime: networkRoundTripTime,
          extra: this.state.webrtcStats,
        })
      );
    });
    MessageEmitter.on('WEB_RTC_STATS', (newValue) => this.setState({ webrtcStats: newValue }));
  }

  componentWillUnmount() {
    MessageEmitter.off('WEB_RTC_STATS');
    if (this.state.timer) {
      console.log('Unsubscribe from Round Trip Time Monitor');
      clearInterval(this.state.timer);
      this.setState({ timer: undefined });
    }
    socket.close()
  }

  render() {
    return null;
  }
}

export default RoundTripTimeMonitor;
