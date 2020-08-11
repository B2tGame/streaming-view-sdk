import io from 'socket.io-client';
import React, { Component } from 'react';
import qs from 'qs';
import url from 'url';
import MessageEmitter from './MessageEmitter';

const DEFAULT_ROUND_TRIP_TIME_SERVER =
  window.location.protocol +
  '//' +
  window.location.hostname +
  ':' +
  window.location.port +
  window.location.pathname.replace(/\/$/, '') +
  '/rtt-websocket';

class RoundTripTimeMonitor extends Component {
  constructor() {
    super();
    this.state = {};
  }

  static getRTTServiceEndpoint() {
    const endpoint = (qs.parse(window.location.search, { ignoreQueryPrefix: true }) || {}).rtt;
    return endpoint ? endpoint : DEFAULT_ROUND_TRIP_TIME_SERVER;
  }

  componentDidMount() {
    console.log('Round Trip Time Monitor: ', RoundTripTimeMonitor.getRTTServiceEndpoint());

    const uri = url.parse(RoundTripTimeMonitor.getRTTServiceEndpoint());
    const socket = io(uri.protocol + '//' + uri.host, {
      path: (uri.pathname !== '/' ? uri.pathname : '') + '/socket.io',
    });

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
