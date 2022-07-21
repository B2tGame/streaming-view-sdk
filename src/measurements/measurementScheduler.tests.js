import assert from 'assert';
import proxyquire from 'proxyquire';

const moduleToBeTested = './measurementScheduler';

//
// This makes copies of the module to be tested, each copy can be generated with different mocks
//

const deviceInfoStub = {
  '../service/DeviceInfoService': {
    createDeviceInfo: () => Promise.resolve({ recommendation: [], deviceInfoId: 'fakeDeviceInfoId' }),
    updateDeviceInfo: () => null,
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
    it('responds when a measurement is immediately available', async () => {
      const s = newMeasurementScheduler({
        axiosGet: (url) => {
          assert.equal(
            url,
            'https://fakeApiEndpoint/api/streaming-games/predicted-game-experience?connectivity-info=%7B%22rttStatsByRegionByTurn%22%3A%7B%7D%7D&deviceInfoId=fakeDeviceInfoId'
          );
          return Promise.resolve({ data: { apps: ['someApp'] } });
        },
      });

      const result = await s.getPredictedGameExperiences();

      assert.deepEqual(result, { apps: ['someApp'] });
    });

    it('polls when connectivity measures take a while to arrive', async () => {
      const s = newMeasurementScheduler({
        axiosGet: (url) => {
          assert.equal(
            url,
            'https://fakeApiEndpoint/api/streaming-games/predicted-game-experience?connectivity-info=%7B%22rttStatsByRegionByTurn%22%3A%7B%7D%7D&deviceInfoId=fakeDeviceInfoId'
          );
          return Promise.resolve({ data: { apps: ['someApp'] } });
        },
      });

      const result = await s.getPredictedGameExperiences(10);

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
