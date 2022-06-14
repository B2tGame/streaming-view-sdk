import assert from 'assert';
import axios from 'axios';
import proxyquire from 'proxyquire';
import StreamingEvent from '../../src/StreamingEvent';
import StreamWebRtc from '../../src/service/StreamWebRtc';

// This makes copies of the module to be tested, each copy can be generated with different mocks
const makeNetworkConnectivity = (mocks) => proxyquire.noCallThru()('../../src/service/networkConnectivity', mocks).default;

// Mock for axios.get
const axiosGetMock = (urlToResponse) => (url, options) => new Promise((resolve) => setTimeout(() => resolve(urlToResponse(url)), 1));

// Mock for StreamWebRtc
// (we don't want to extend the original StreamWebRtc class, otherwise we risk unwittingly executing non-mocked methods)
class StreamWebRtcMock {
  constructor() {}

  on(eventName, callback) {
    switch (eventName) {
      case StreamingEvent.WEBRTC_CLIENT_CONNECTED:
        setTimeout(callback, 10);
        break;
      case StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT:
        setTimeout(() => callback(230), 30);
        setTimeout(() => callback(180), 100);
        break;
      default:
        throw new Error(`Unknown event name: ${eventName}`);
    }

    return this;
  }

  off(eventName, callback) {
    return this;
  }

  close() {}

  static calculateRoundTripTimeStats = StreamWebRtc.calculateRoundTripTimeStats;
}

const mockEndpoint = 'mockEndpoint';

const mockRecommendedEdges = [
  {
    edgeRegion: 'pa-papuasia-1',
    measurementEndpoints: ['papuasia-host-1', 'papuasia-host-2', 'papuasia-host-3']
  },
  {
    edgeRegion: 'mo-cornwall-0',
    measurementEndpoints: ['cornwall-host-1', 'cornwall-host-2']
  }
];

describe('networkConnectivity', () => {
  describe('measure', () => {
    before(() => {});

    it('measure', async () => {
      const networkConnectivity = makeNetworkConnectivity({
        axios: { get: axiosGetMock((url) => ({ data: mockRecommendedEdges })) },
        '../service/StreamWebRtc': StreamWebRtcMock
      });

      const expected = {
        predictedGameExperience: undefined,
        recommendedRegion: 'pa-papuasia-1',
        rttStatsByRegionByTurn: {
          'pa-papuasia-1': {
            0: {
              rtt: 205,
              stdDev: 25
            },
            1: {
              rtt: 205,
              stdDev: 25
            }
          },
          'mo-cornwall-0': {
            0: {
              rtt: 205,
              stdDev: 25
            },
            1: {
              rtt: 205,
              stdDev: 25
            }
          }
        }
      };

      const actual = await networkConnectivity.measure(mockEndpoint, mockRecommendedEdges);

      assert.deepStrictEqual(actual, expected);
    });
  });
});
