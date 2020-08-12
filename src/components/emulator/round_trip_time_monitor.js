import io from 'socket.io-client';
import React, { Component } from 'react';
import url from 'url';
import MessageEmitter from './MessageEmitter';

class RoundTripTimeMonitor extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentDidMount() {
    console.log(this.props.endpoint)

    const socket = io(this.props.endpoint, {path: '/'+ this.props.edgeNodeId  + '/socket.io/rtt-websocket'});

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
  }

  render() {
    const cssStyle = {
      display: 'none',
    };
    return <span style={cssStyle}></span>;
  }
}

export default RoundTripTimeMonitor;
