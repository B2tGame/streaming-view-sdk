import assert from 'assert';
import proxyquire from 'proxyquire';
import StreamWebRtc from './StreamWebRtc';

// This makes copies of the module to be tested, each copy can be generated with different mocks
const makeNetworkConnectivity = (mocks) => proxyquire.noCallThru()('./networkConnectivity', mocks).default;

// Mock for axios.get
const axiosGetMock = (urlToResponse) => (url, options) => new Promise((resolve) => setTimeout(() => resolve(urlToResponse(url)), 1));

// Mock for StreamWebRtc
// (we don't want to extend the original StreamWebRtc class, otherwise we risk unwittingly executing non-mocked methods)
const StreamWebRtcMock = {
  calculateRoundTripTimeStats: StreamWebRtc.calculateRoundTripTimeStats,
  initRttMeasurement: ({ onConnected, onRttMeasure }) =>
    new Promise((resolve) => {
      setTimeout(onConnected, 10);
      setTimeout(() => onRttMeasure(230), 30);
      setTimeout(() => onRttMeasure(180), 100);
      setTimeout(() => resolve(() => {}), 1);
    }),
};

const mockEndpoint = 'mockEndpoint';

const mockRecommendedEdges = [
  {
    edgeRegion: 'pa-papuasia-1',
    measurementEndpoints: ['papuasia-host-1', 'papuasia-host-2', 'papuasia-host-3'],
  },
  {
    edgeRegion: 'mo-cornwall-0',
    measurementEndpoints: ['cornwall-host-1', 'cornwall-host-2'],
  },
];

describe('networkConnectivity', () => {
  describe('measure', () => {
    before(() => {});

    it('measure', async () => {
      const networkConnectivity = makeNetworkConnectivity({
        axios: { get: axiosGetMock((url) => ({ data: mockRecommendedEdges })) },
        '../service/StreamWebRtc': StreamWebRtcMock,
      });

      const expected = {
        predictedGameExperience: undefined,
        recommendedRegion: 'pa-papuasia-1',
        rttStatsByRegionByTurn: {
          'pa-papuasia-1': {
            0: {
              rtt: 205,
              stdDev: 25,
            },
            1: {
              rtt: 205,
              stdDev: 25,
            },
          },
          'mo-cornwall-0': {
            0: {
              rtt: 205,
              stdDev: 25,
            },
            1: {
              rtt: 205,
              stdDev: 25,
            },
          },
        },
      };

      const actual = await networkConnectivity.measure(mockEndpoint, mockRecommendedEdges);

      assert.deepStrictEqual(actual, expected);
    });
  });
});
