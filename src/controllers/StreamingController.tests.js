import assert from 'assert';
import proxyquire from 'proxyquire';

const moduleToBeTested = './StreamingController';

//
// This makes copies of the module to be tested, each copy can be generated with different mocks
//
const makeModule = (mocks) => proxyquire.noCallThru()(moduleToBeTested, mocks).default;

//
// Mocks
//
const axiosGetMock = (urlToResponse) => (url, options) => new Promise((resolve) => setTimeout(() => resolve(urlToResponse(url)), 1));

const measuresMock = {
  connectivityInfo: 'FakeConnectivityInfoPayload',
  deviceInfo: 'FakeDeviceInfoPayload'
};

//
// Tests
//
describe('StreamingController', () => {
  describe('getPredictedGameExperiences', () => {
    // This is needed by measurementScheduler
    global.navigator = {};

    let lastMeasure = null;

    const buildStreamingController = () =>
      makeModule({
        axios: {
          get: axiosGetMock((url) => ({ data: { apps: ['app1', 'app2'] } }))
        }
      })({
        apiEndpoint: 'https://fake.meh',
        measurementScheduler: {
          getLastMeasure: () => lastMeasure,
          changeApiEndpoint: () => null,
          startMeasuring: () => null,
          stopMeasuring: () => null
        }
      });

    it('responds quickly when connectivity measures are available', async () => {
      lastMeasure = measuresMock;

      const sc = await buildStreamingController();

      // We set a really high polling interval to ensure that, if the result is not picked at once, the tests will timeout
      const result = await sc.getPredictedGameExperiences(1000 * 1000);

      assert.deepEqual(result, { apps: ['app1', 'app2'] });
    });

    it('polls when connectivity measures are NOT available', async () => {
      lastMeasure = null;

      const sc = await buildStreamingController();

      // lastMeasure will actually become available only after a while
      setTimeout(() => { lastMeasure = measuresMock; }, 200);

      // This time we set a pollingTime much lower than the delay above
      const result = await sc.getPredictedGameExperiences(10);

      assert.deepEqual(result, { apps: ['app1', 'app2'] });
    });
  });
});
