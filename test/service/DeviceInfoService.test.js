import { server } from '../mocks/server';
import uuid from '../mocks/uuid';
import DeviceInfoService from '../../src/service/DeviceInfoService';

const createDeviceInfoResponse = { deviceInfoId: uuid() };
const deviceInfoService = new DeviceInfoService('http://localhost');

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
      const result = await deviceInfoService.createDeviceInfo();
      expect(result).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredUserId()).toEqual(uuid());
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
    test('POST can create a device-info providing a custom userId', async () => {
      const result = await deviceInfoService.createDeviceInfo({ userId: uuid() });
      expect(result).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredUserId()).toBeNull();
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
  });
  describe('updateDeviceInfoId', () => {
    test('POST can update an existing deviceInfo using the stored deviceInfoId', async () => {
      // create a device-info.
      await deviceInfoService.createDeviceInfo();
      // get stored id from localStorage
      const deviceInfoId = DeviceInfoService.getStoredDeviceInfoId();
      expect(deviceInfoId).toEqual(uuid());
      const res = await deviceInfoService.updateDeviceInfo(uuid(), {
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
