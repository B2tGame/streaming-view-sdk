import assert from 'assert';
import proxyquire from 'proxyquire';

const moduleToBeTested = './measurementScheduler';

//
// This makes copies of the module to be tested, each copy can be generated with different mocks
//

const deviceInfoStub = {
  axios: {
    post: () => Promise.resolve({ data: { recommendation: [], deviceInfoId: 'fakeDeviceInfoId' } }),
  },
};

const makeModule = (stubs) =>
  proxyquire(moduleToBeTested, {
    './service/networkConnectivity': proxyquire.noCallThru()('./service/networkConnectivity', stubs.networkConnectivity),
    './service/deviceInfo': proxyquire.noCallThru()('./service/deviceInfo', deviceInfoStub),
  }).default;

//
// Tests
//
describe('measurementScheduler', () => {
  // These are needed by deviceInfo
  global.window = {
    screen: {
      width: 123,
      height: 321,
    },
  };

  global.document = {
    documentElement: {
      clientWidth: 100,
      clientHeight: 200,
    },
  };

  global.localStorage = {
    getItem: () => null,
    setItem: () => null,
  };

  const newMeasurementScheduler = ({ axiosGet }) =>
    makeModule({
      networkConnectivity: {
        axios: {
          get: axiosGet,
        },
      },
    })({
      navigatorConnection: {},
      apiEndpoint: 'https://fakeApiEndpoint',
      interval: 10,
      onMeasures: () => null,
    });

  describe('getPredictedGameExperiences', () => {
    it.skip('polls only when a measurement is not available', async () => {
      // How does this test work:
      //
      // 1. Create a new scheduler
      // 2. The first time we call getPredictedGameExperiences, it must poll, because it doesn't have any measurement
      // 3. The second time we call getPredictedGameExperiences, it must **NOT** poll, and instead use immediately the available measurement
      //

      const expectedCallUrl =
        'https://fakeApiEndpoint/api/streaming-games/predicted-game-experience?connectivity-info=%7B%22rttStatsByRegionByTurn%22%3A%7B%7D%7D&deviceInfoId=fakeDeviceInfoId';

      const axiosGet = (url) => {
        assert.equal(url, expectedCallUrl);
        return Promise.resolve({ data: { apps: ['someApp'] } });
      };

      let result;

      // 1. Create a new scheduler, with no measurement available
      const s = newMeasurementScheduler({ axiosGet });

      // lastMeasure should NOT be available
      assert(!s.getLastMeasure());

      // 2. Call getPredictedGameExperiences to get the measure
      result = await s.getPredictedGameExperiences(50);

      assert.deepEqual(result, { apps: ['someApp'] });

      // lastMeasure SHOULD be available
      assert(!!s.getLastMeasure());

      // 3. Call getPredictedGameExperiences again with a pollingInterval guaranteed to send the test in timeout
      result = await s.getPredictedGameExperiences(99999999);

      assert.deepEqual(result, { apps: ['someApp'] });
    });
  });

  describe('getGameAvailability', () => {
    it('game availability api exists', async () => {
      const apps = [
        {
          appId: 123,
          available: true,
        },
        {
          appId: 321,
          available: false,
        },
      ];
      const s = newMeasurementScheduler({
        axiosGet: (url) => {
          assert.equal(url, 'https://fakeApiEndpoint/api/streaming-games/game-availability?deviceInfoId=fakeDeviceInfoId');
          return Promise.resolve({ data: { apps } });
        },
      });

      const result = await s.getGameAvailability();

      assert.deepEqual(result, { apps });
    });
  });
});
