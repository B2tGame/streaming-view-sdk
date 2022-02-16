const nock = require('nock');

import DeviceInfoService from '../../src/service/DeviceInfoService';
import { v4 as uuid } from 'uuid';

jest.mock('uuid');

uuid.mockImplementation(() => 'fake-uuid');

const createDeviceInfoResponse = { deviceInfoId: uuid() };

const updateDeviceInfoPayload = {
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
};

const apiEndpoint = 'http://localhost';
const deviceInfoService = new DeviceInfoService(apiEndpoint);

const scope = nock(apiEndpoint)
  .post('/api/streaming-games/edge-node/device-info', { userId: uuid() })
  .reply(200, createDeviceInfoResponse)
  .post(`/api/streaming-games/edge-node/device-info/${uuid()}`, updateDeviceInfoPayload)
  .reply(200);

describe('DeviceInfoService', () => {
  afterEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('createDeviceInfo', () => {
    test('POST can create a device-info without providing a userId', async () => {
      const result = await deviceInfoService.createDeviceInfo();
      expect(result).toStrictEqual(createDeviceInfoResponse);
      expect(DeviceInfoService.getStoredUserId()).toEqual(uuid());
      expect(DeviceInfoService.getStoredDeviceInfoId()).toEqual(uuid());
    });
    test('POST can create a device-info with providing a custom userId', async () => {
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
      // expect(deviceInfoId).toBeTruthy();
      const res = await deviceInfoService.updateDeviceInfo(uuid(), updateDeviceInfoPayload);
      expect(res.status).toBe(200);
    });
  });
});
