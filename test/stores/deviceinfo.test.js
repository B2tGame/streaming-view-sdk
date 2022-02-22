import { server } from '../mocks/server';
import uuid from '../mocks/uuid';
import DeviceInfoService from '../../src/service/DeviceInfoService';
import { createDeviceInfoResponse } from '../mocks/response';
import { getNetworkDeviceInfo, updateDeviceInfo } from '../../src/stores/deviceInfo';

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
    test('can get a device-info from api and save it in local-storage without providing a userId', async () => {
      const res = await getNetworkDeviceInfo(apiEndpoint);
      expect(res).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
  });
  describe('updateDeviceInfo', () => {
    test('can update the latest created device-info fetched from api', async () => {
      await getNetworkDeviceInfo(apiEndpoint);
      const res = await updateDeviceInfo(apiEndpoint, {
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
      });
      expect(res.status).toBe(200);
    });
  });
});
