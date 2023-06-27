import axios, { AxiosResponse } from 'axios';

const DATA_CHANNEL_NAME = 'streaming-webrtc-server';
const PING_INTERVAL = 25;

const waitUntilIceGatheringCompletion = (peerConnection: RTCPeerConnection) =>
  new Promise<void>((resolve) => {
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

    window.setTimeout(() => {
      if (peerConnection.iceGatheringState !== 'complete') {
        console.warn('Timed out waiting for host candidates');
        done();
      }
    }, 10000);
  });

const onConnectionStateChange = (config: RTTMeasurementConfig, state: PeerState) => (event: Event) => {
  switch (state.peerConnection.connectionState) {
    case 'connected':
      config.onConnected && config.onConnected();
      break;

    case 'disconnected':
      axios.delete(`${config.host}/connections/${state.remotePeerConnection.id}`).catch(console.error);

      state.peerConnection.removeEventListener('connectionstatechange', state.onConnectionStateChange);

      if (state.onMessage) {
        state.dataChannel?.removeEventListener('message', state.onMessage);
      }

      window.window.clearInterval(state.pingIntervalId);

      break;

    default:
      break;
  }
};

type PongEvent = {
  type: 'pong';
  timestamp: number;
};

type MessageData = PongEvent;

const onMessage = (config: RTTMeasurementConfig) => (event: MessageEvent<string>) => {
  const eventData = JSON.parse(event.data) as MessageData;

  if (eventData.type === 'pong') {
    const sendTime = Math.trunc(eventData.timestamp);
    const rtt = Date.now() - sendTime;
    config.onRttMeasure && config.onRttMeasure(rtt);
  }
};

type PeerState = {
  peerConnection: RTCPeerConnection;
  remotePeerConnection: RemoteConnections;
  onConnectionStateChange: (event: Event) => void;
  onDataChannel: (event: RTCDataChannelEvent) => void;
  pingIntervalId?: number;
  packageSequenceId?: number;
  onMessage?: (ev: MessageEvent<any>) => void;
  dataChannel?: RTCDataChannel;
};

const onDataChannel = (config: RTTMeasurementConfig, state: PeerState) => (event: RTCDataChannelEvent) => {
  if (event.channel.label !== DATA_CHANNEL_NAME) {
    return;
  }

  state.packageSequenceId = 0;

  // Can it happen that we have already an onMessage?
  state.onMessage = onMessage(config);

  state.dataChannel = event.channel;
  state.dataChannel.addEventListener('message', state.onMessage);

  const sendPing = () => {
    if (state.dataChannel!.readyState === 'open') {
      state.dataChannel!.send(
        JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
          sequenceId: state.packageSequenceId!++, // incremental counter to be able to detect out of order or lost packages
        })
      );
    }
  };

  state.pingIntervalId = window.setInterval(sendPing, PING_INTERVAL);
};

const closeEverything = (state: PeerState) => () => {
  if (state.onMessage) {
    state.dataChannel?.removeEventListener('message', state.onMessage);
  }
  state.peerConnection.removeEventListener('connectionstatechange', state.onConnectionStateChange);
  state.peerConnection.removeEventListener('datachannel', state.onDataChannel);
  state.peerConnection.close();
};

type RTTMeasurementConfig = {
  host: string;
  iceServerCandidates: RTCIceServer[];
  onConnected?: () => void;
  onRttMeasure?: (rtt: number) => void;
};

type EmptyConnectionDescription = {};
type ConnectionDescription = RTCSessionDescriptionInit | EmptyConnectionDescription;

type RemoteConnections = {
  id: string;
  state: string;
  iceConnectionState: string;
  localDescription: RTCSessionDescriptionInit;
  remoteDescription: ConnectionDescription;
  signalingState: string;
};

const throwOnCall =
  (name: string) =>
  (...args: any[]) => {
    throw new Error(`${name} has not been initialised`);
  };

export async function initRttMeasurement(config: RTTMeasurementConfig) {
  const state: PeerState = {
    peerConnection: new RTCPeerConnection({
      // @ts-ignore As of June 21 2023, sdpSemantics is a valid key, see here: https://webrtc.github.io/webrtc-org/web-apis/chrome/unified-plan/
      sdpSemantics: 'unified-plan',
      iceServers: config.iceServerCandidates,
      iceTransportPolicy: 'relay',
    }),
    remotePeerConnection: (await axios.post<any, AxiosResponse<RemoteConnections>>(`${config.host}/connections`)).data,
    onConnectionStateChange: throwOnCall('onConnectionStateChange listener'),
    onDataChannel: throwOnCall('onDataChannel listener'),
  };

  // Add event listeners
  state.onConnectionStateChange = onConnectionStateChange(config, state);
  state.peerConnection.addEventListener('connectionstatechange', state.onConnectionStateChange);

  state.onDataChannel = onDataChannel(config, state);
  state.peerConnection.addEventListener('datachannel', state.onDataChannel);

  // We're starting this now and awaiting for it later, because it could be completed at any time.
  const iceGatheringComplete = waitUntilIceGatheringCompletion(state.peerConnection);

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

export type RoundTripTimeStats = { rtt: number; stdDev: number };

/**
 * Calculates mean rtt and standard deviation values for the given input
 */
export function calculateRoundTripTimeStats(rttValues: number[]): RoundTripTimeStats {
  const n = rttValues.length;

  if (n < 1) {
    return { rtt: 0, stdDev: 0 };
  }

  // TODO The output values should NOT be rounded here, but only right before actually needed, such as when showing them to the user.
  const avg = Math.round(rttValues.reduce((acc, rtt) => acc + rtt, 0) / n);
  const stdDev = Math.round(Math.sqrt(rttValues.reduce((acc, rtt) => acc + (rtt - avg) * (rtt - avg), 0) / n));

  return { rtt: avg, stdDev };
}
