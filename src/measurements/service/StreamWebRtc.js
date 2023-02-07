import axios from 'axios';

const DATA_CHANNEL_NAME = 'streaming-webrtc-server';
const PING_INTERVAL = 25;

const waitIceGatheringCompletion = (peerConnection) =>
  new Promise((resolve) => {
    const onStateChange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        done();
      }
    };

    const done = () => {
      peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
      resolve();
    };

    peerConnection.addEventListener('icegatheringstatechange', onStateChange);

    setTimeout(() => {
      if (peerConnection.iceGatheringState !== 'complete') {
        console.warn('Timed out waiting for host candidates');
        done();
      }
    }, 10000);
  });

const onConnectionStateChange = (config, state) => (event) => {
  switch (state.peerConnection.connectionState) {
    case 'connected':
      config.onConnected && config.onConnected();
      break;

    case 'disconnected':
      axios.delete(`${config.host}/connections/${state.remotePeerConnection.id}`).catch(console.error);

      state.peerConnection.removeEventListener('connectionstatechange', state.onConnectionStateChange);

      state.dataChannel?.removeEventListener('message', state.onMessage);

      clearInterval(state.pingIntervalId);

      break;

    default:
      break;
  }
};

const onMessage = (config) => (event) => {
  const { type, timestamp } = JSON.parse(event.data);
  if (type === 'pong') {
    const sendTime = Math.trunc(timestamp);
    const rtt = Date.now() - sendTime;
    config.onRttMeasure && config.onRttMeasure(rtt);
  }
};

const onDataChannel = (config, state) => (event) => {
  if (event.channel.label !== DATA_CHANNEL_NAME) {
    return;
  }

  state.packageSequenceId = 0;

  // Can it happen that we have already an onMessage?
  state.onMessage = onMessage(config);

  state.dataChannel = event.channel;
  state.dataChannel.addEventListener('message', state.onMessage);

  const sendPing = () => {
    if (state.dataChannel.readyState === 'open') {
      state.dataChannel.send(
        JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
          sequenceId: state.packageSequenceId++, // incremental counter to be able to detect out of order or lost packages
        })
      );
    }
  };

  state.pingIntervalId = setInterval(sendPing, PING_INTERVAL);
};

const closeEverything = (state) => () => {
  state.dataChannel?.removeEventListener('message', state.onMessage);
  state.peerConnection.removeEventListener('connectionstatechange', state.onConnectionStateChange);
  state.peerConnection.removeEventListener('datachannel', state.onDataChannel);
  state.peerConnection.close();
};

/**
 * @param {{
 *    host: string,
 *    iceServerCandidates: <array *>,
 *    onConnected: function,
 *    onRttMeasure: function,
 * } config
 * @returns {function} to close and tear down the connection.
 */
async function initRttMeasurement(config) {
  const state = {};

  state.remotePeerConnection = (await axios.post(`${config.host}/connections`)).data;

  // Instantiate
  state.peerConnection = new RTCPeerConnection({
    sdpSemantics: 'unified-plan',
    iceServers: config.iceServerCandidates,
    iceTransportPolicy: 'relay',
  });

  // Add event listeners
  state.onConnectionStateChange = onConnectionStateChange(config, state);
  state.peerConnection.addEventListener('connectionstatechange', state.onConnectionStateChange);

  state.onDataChannel = onDataChannel(config, state);
  state.peerConnection.addEventListener('datachannel', state.onDataChannel);

  // We're starting this now and awaiting for it later, because it could be completed at any time.
  const iceGatheringComplete = waitIceGatheringCompletion(state.peerConnection);

  const close = closeEverything(state);

  try {
    await state.peerConnection.setRemoteDescription(state.remotePeerConnection.localDescription);

    const answer = await state.peerConnection.createAnswer();
    await state.peerConnection.setLocalDescription(answer);

    await iceGatheringComplete;

    await axios(`${config.host}/connections/${state.remotePeerConnection.id}/remote-description`, {
      method: 'POST',
      data: JSON.stringify(state.peerConnection.localDescription),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    close();
    throw e;
  }

  return close;
}

/**
 * Calculates mean rtt and standard deviation values for the given input
 * @param {number[]} values
 * @return {{rtt: number, stdDev: number}}
 *
 * TODO: rename rtt to avg
 */
function calculateRoundTripTimeStats(rttValues) {
  const n = rttValues.length;

  if (n < 1) {
    return { rtt: 0, stdDev: 0 };
  }

  // TODO The output values should NOT be rounded here, but only right before actually needed, such as when showing them to the user.
  const avg = Math.round(rttValues.reduce((acc, rtt) => acc + rtt, 0) / n);
  const stdDev = Math.round(Math.sqrt(rttValues.reduce((acc, rtt) => acc + (rtt - avg) * (rtt - avg), 0) / n));

  return { rtt: avg, stdDev };
}

export default { initRttMeasurement, calculateRoundTripTimeStats };
