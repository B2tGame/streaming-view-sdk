import { server } from '../mocks/server';
import uuid from '../mocks/uuid';
import DeviceInfoService from '../../src/service/DeviceInfoService';
import { getNetworkDeviceInfo, updateDeviceInfo } from '../../src/stores/deviceInfo';

const createDeviceInfoResponse = { deviceInfoId: uuid() };
const apiEndpoint = 'http://localhost';

describe('deviceinfo', () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    jest.clearAllMocks();
  });

  describe('getNetworkDeviceInfo', () => {
    test('can get a device-info from api and save it in local-storage', async () => {
      const res = await getNetworkDeviceInfo(apiEndpoint);
      expect(res).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
  });
  describe('updateDeviceInfo', () => {
    test('can update the latest created device-info fetched from api', async () => {
      await getNetworkDeviceInfo(apiEndpoint);
      const res = await updateDeviceInfo(
        {
          rttRegionMeasurement: {
            'eu-central-1': {
              default: {
                rtt: 10,
                stdDev: 3
              },
              subspace: {
                rtt: 20,
                stdDev: 5
              }
            }
          }
        },
        apiEndpoint
      );
      expect(res.status).toBe(200);
    });
  });
});
