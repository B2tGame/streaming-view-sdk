import PropTypes from 'prop-types';
import { Component } from 'react';

class RoundTripTimeMonitor extends Component {
  static propTypes = {
    streamSocket: PropTypes.object.isRequired, // socket connection to emulator
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.streamSocket.on('error', (err) => {
      console.log('Round Trip Time Monitor: ', err);
    });

    this.props.streamSocket.on('pong', (networkRoundTripTime) => {
      this.props.streamSocket.emit(
        'message',
        JSON.stringify({
          type: 'report',
          timestamp: Date.now(),
          networkRoundTripTime: networkRoundTripTime,
          extra: this.state.webrtcStats,
        })
      );
    });

    this.props.rtcReportHandler &&
      this.props.rtcReportHandler.on('WEB_RTC_STATS', (newValue) => this.setState({ webrtcStats: newValue }));
  }

  componentWillUnmount() {
    this.props.rtcReportHandler && this.props.rtcReportHandler.off('WEB_RTC_STATS');
    if (this.state.timer) {
      console.log('Unsubscribe from Round Trip Time Monitor');
      clearInterval(this.state.timer);
      this.setState({ timer: undefined });
    }
  }

  render() {
    return null;
  }
}

export default RoundTripTimeMonitor;
