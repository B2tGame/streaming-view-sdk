import assert from 'assert';
import proxyquire from 'proxyquire';

const moduleToBeTested = '../src/StreamingController';

// This makes copies of the module to be tested, each copy can be generated with different mocks
const makeModule = (mocks) => proxyquire.noCallThru()(moduleToBeTested, mocks).default;

// Mock for axios.get
const axiosGetMock = (urlToResponse) => (url, options) => new Promise((resolve) => setTimeout(() => resolve(urlToResponse(url)), 1));

const newMeasurementSchedulerMock = (withOnMeasure) => (options) => {

  // `(options) =>` needs to return synchronously, but this means that we lose the ability to track asynchronous errors
  withOnMeasure(options.onMeasures).catch((err) => {
    console.error(err);
    process.exit(-1);
  });

  return {
    startMeasuring: () => null,
    stopMeasuring: () => null
  };
};

const delayBy = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

describe('StreamingController', () => {
  describe('getPredictedGameExperiences', () => {
    // This is needed by measurementScheduler
    global.navigator = {};

    const axiosMock = { get: axiosGetMock((url) => ({ data: { apps: ['app1', 'app2'] } })) };

    const measuresMock = {
      connectivityInfo: 'FakeConnectivityInfoPayload',
      deviceInfo: 'FakeDeviceInfoPayload'
    };

    it('responds quickly when connectivity measures are available', async () => {
      const buildStreamingController = makeModule({
        axios: axiosMock,
        './measurementScheduler': newMeasurementSchedulerMock(async (onMeasures) => {
          await delayBy(1);
          onMeasures(measuresMock);
        })
      });

      const sc = await buildStreamingController({ apiEndpoint: 'https://fake.meh' });
      await delayBy(2);

      // We set a really high polling interval to ensure that, if the result is not picked at once, the tests will timeout
      const result = await sc.getPredictedGameExperiences(1000 * 1000);

      assert.deepEqual(result, { apps: ['app1', 'app2'] });
    });

    it('polls when connectivity measures are NOT available', async () => {
      const buildStreamingController = makeModule({
        axios: axiosMock,
        './measurementScheduler': newMeasurementSchedulerMock(async (onMeasures) => {
          await delayBy(10);
          onMeasures(measuresMock);
        })
      });

      const sc = await buildStreamingController({ apiEndpoint: 'https://fake.meh' });

      // No delay here, we want to simulate calling getPredictedGameExperiences at the earliest possible time

      // This time we set a pollingTime much lower than the onMeasures delay
      const result = await sc.getPredictedGameExperiences(10);

      assert.deepEqual(result, { apps: ['app1', 'app2'] });
    });
  });
});
