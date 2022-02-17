import { server } from '../mocks/server';
import uuid from '../mocks/uuid';
import { createDeviceInfoResponse } from '../mocks/response';
import DeviceInfoService from '../../src/service/DeviceInfoService';

const apiEndpoint = 'http://localhost';

describe('DeviceInfoService', () => {
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

  describe('createDeviceInfo', () => {
    test('POST can create a device-info without providing a userId', async () => {
      const result = await DeviceInfoService.createDeviceInfo(apiEndpoint);
      expect(result).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredUserId()).toEqual(uuid());
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
    test('POST can create a device-info providing a custom userId', async () => {
      const result = await DeviceInfoService.createDeviceInfo(apiEndpoint, { userId: uuid() });
      expect(result).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredUserId()).toBeNull();
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
  });
  describe('updateDeviceInfoId', () => {
    test('POST can update an existing deviceInfo using the stored deviceInfoId', async () => {
      // create a device-info.
      await DeviceInfoService.createDeviceInfo(apiEndpoint);
      // get stored id from localStorage
      const deviceInfoId = DeviceInfoService.getStoredDeviceInfoId();
      expect(deviceInfoId).toEqual(uuid());
      const res = await DeviceInfoService.updateDeviceInfo(apiEndpoint, {
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
