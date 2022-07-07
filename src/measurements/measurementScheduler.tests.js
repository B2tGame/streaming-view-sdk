import assert from 'assert';
import proxyquire from 'proxyquire';

const moduleToBeTested = './measurementScheduler';

//
// This makes copies of the module to be tested, each copy can be generated with different mocks
//
const makeModule = (mocks) => proxyquire.noCallThru()(moduleToBeTested, mocks).default;

//
// Mocks
//

const delayBy = (milliseconds, value) => new Promise((resolve) => setTimeout(() => resolve(value), milliseconds));

const networkConnectivityMock = () => ({
  measure: (apiEndpoint, recommendation) => delayBy(1, {}),
  getPredictedGameExperiences: () => delayBy(1, 'fakePredictedGameExperiencesResult'),
});

const deviceInfoMock = (delay) => ({
  getDeviceInfo: (apiEndpoint) => delayBy(delay, {}),
  updateDeviceInfo: () => null,
});

//
// Tests
//
describe('measurementScheduler', () => {
  describe('getPredictedGameExperiences', () => {
    const newMeasurementScheduler = (delay) =>
      makeModule({
        './service/networkConnectivity': networkConnectivityMock(),
        './service/deviceInfo': deviceInfoMock(delay),
      })({
        navigatorConnection: {},
        apiEndpoint: '',
        interval: 10,
        onMeasures: () => null,
      });

    it('responds when a measurement is immediately available', async () => {
      const s = newMeasurementScheduler(0);

      const result = await s.getPredictedGameExperiences();

      assert.deepEqual(result, 'fakePredictedGameExperiencesResult');
    });

    it('polls when connectivity measures take a while to arrive', async () => {
      const s = newMeasurementScheduler(100);

      const result = await s.getPredictedGameExperiences(10);

      assert.deepEqual(result, 'fakePredictedGameExperiencesResult');
    });
  });
});
