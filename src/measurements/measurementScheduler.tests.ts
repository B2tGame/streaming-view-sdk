import { describe, expect, it, test, jest } from '@jest/globals';
import measurementSchedulerExport from './measurementScheduler';
const moduleToBeTested = './measurementScheduler';

//
// This makes copies of the module to be tested, each copy can be generated with different mocks
//

const deviceInfoStub = {
  axios: {
    post: () => Promise.resolve({ data: { recommendation: [], deviceInfoId: 'fakeDeviceInfoId' } }),
  },
};

const makeModule = (stubs: any): typeof measurementSchedulerExport => {
  jest.mock('./service/networkConnectivity', () => stubs.networkConnectivity);
  jest.mock('./service/deviceInfo', () => deviceInfoStub);

  // @ts-ignore
  return require(moduleToBeTested).default;
};

//
// Tests
//
describe('measurementScheduler', () => {
  // @ts-ignore// These are needed by deviceInfo
  global.window = {
    screen: {
      width: 123,
      height: 321,
    },
  } as Window & typeof globalThis;

  // @ts-ignore
  global.document = {
    documentElement: {
      clientWidth: 100,
      clientHeight: 200,
    },
  } as Document;

  // @ts-ignore
  global.localStorage = {
    getItem: () => null,
    setItem: () => null,
  } as unknown as Storage;

  const newMeasurementScheduler = ({ axiosGet }: any) => {
    let m = makeModule({
      networkConnectivity: {
        axios: {
          get: axiosGet,
        },
      },
    });

    return m({
      // @ts-ignore
      navigatorConnection: {},
      apiEndpoint: 'https://fakeApiEndpoint',
      interval: 10,
      onMeasures: () => null,
    });
  };

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

      const axiosGet = (url: string) => {
        expect(url).toEqual(expectedCallUrl);
        return Promise.resolve({ data: { apps: ['someApp'] } });
      };

      let result;

      // 1. Create a new scheduler, with no measurement available
      const s = newMeasurementScheduler({ axiosGet });

      // lastMeasure should NOT be available
      expect(s.getLastMeasure()).toBeFalsy();

      // 2. Call getPredictedGameExperiences to get the measure
      result = await s.getPredictedGameExperiences(50);

      expect(result).toEqual({ apps: ['someApp'] });

      // lastMeasure SHOULD be available
      expect(s.getLastMeasure()).toBeTruthy();

      // 3. Call getPredictedGameExperiences again with a pollingInterval guaranteed to send the test in timeout
      result = await s.getPredictedGameExperiences(99999999);

      expect(result).toEqual({ apps: ['someApp'] });
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
        axiosGet: (url: any) => {
          expect(url).toEqual('https://fakeApiEndpoint/api/streaming-games/game-availability?deviceInfoId=fakeDeviceInfoId');
          return Promise.resolve({ data: { apps } });
        },
      });

      const result = await s.getGameAvailability();

      expect(result).toEqual({ apps });
    });
  });
});
