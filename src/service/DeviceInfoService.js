import axios from 'axios';
import { v4 as uuid } from 'uuid';

/**
 * Class responsible for DeviceInfo operations. create or update a device info.
 */
export default class DeviceInfoService {
  static USER_ID_KEY() {
    return 'streaming-appland-user-id';
  }
  static DEVICE_INFO_ID_KEY() {
    return 'streaming-appland-device-info-id';
  }
  /**
   * returns the stored userId stored in localStorage.
   *
   * @returns {string|undefined}
   */
  static getStoredUserId() {
    return localStorage.getItem(DeviceInfoService.USER_ID_KEY);
  }

  /**
   * returns the deviceInfoId of the latest device-info fetched from the api stored in localStorage.
   *
   * @returns {string|undefined}
   */
  static getStoredDeviceInfoId() {
    return localStorage.getItem(DeviceInfoService.DEVICE_INFO_ID_KEY);
  }

  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
  }

  createDeviceInfo(body = {}) {
    const { userId } = body;

    // If the user of this method does not provide a userId we create one and store it
    // in localStorage and use it in all sebsequent calls.
    if (!userId) {
      let id = localStorage.getItem(DeviceInfoService.USER_ID_KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(DeviceInfoService.USER_ID_KEY, id);
      }
      body.userId = id;
    }

    return axios.post(`${this.apiEndpoint}/api/streaming-games/edge-node/device-info`, body, { timeout: 2500 }).then((result) => {
      localStorage.setItem(DeviceInfoService.DEVICE_INFO_ID_KEY, result.data.deviceInfoId);
      return result.data;
    });
  }

  updateDeviceInfo(deviceInfoId, body) {
    return axios.post(`${this.apiEndpoint}/api/streaming-games/edge-node/device-info/${deviceInfoId}`, body, { timeout: 2500 });
  }
}
