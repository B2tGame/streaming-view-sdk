import axios from 'axios';
import { v4 as uuid } from 'uuid';

/**
 * Class responsible for DeviceInfo operations. create or update a device info.
 */
export default class DeviceInfoService {
  static get USER_ID_KEY() {
    return 'streaming-appland-user-id';
  }
  static get DEVICE_INFO_ID_KEY() {
    return 'streaming-appland-device-info-id';
  }
  /**
   * returns the stored userId stored in localStorage.
   * @returns {string|undefined}
   */
  static getStoredUserId() {
    return localStorage.getItem(DeviceInfoService.USER_ID_KEY);
  }

  /**
   * returns the deviceInfoId of the latest device-info fetched from the api stored in localStorage.
   * @returns {string|undefined}
   */
  static getStoredDeviceInfoId() {
    return localStorage.getItem(DeviceInfoService.DEVICE_INFO_ID_KEY);
  }

  /**
   * Create a device-info and return it.
   * @param {string} apiEndpoint
   * @param {{userId: string } | undefined } options
   * @returns {{*}}
   */
  static createDeviceInfo(apiEndpoint, options = {}) {
    const { userId } = options;

    // If the user of this method does not provide a userId we create one and store it
    // in localStorage and use it in all subsequent calls.
    if (!userId) {
      let storedUserId = DeviceInfoService.getStoredUserId();
      if (!storedUserId) {
        storedUserId = uuid();
        localStorage.setItem(DeviceInfoService.USER_ID_KEY, storedUserId);
      }
      options.userId = storedUserId;
    }

    return axios.post(`${apiEndpoint}/api/streaming-games/edge-node/device-info`, options, { timeout: 2500 }).then((result) => {
      localStorage.setItem(DeviceInfoService.DEVICE_INFO_ID_KEY, result.data.deviceInfoId);
      return result.data;
    });
  }

  /**
   * Update the latest created device-info
   * @param {string} apiEndpoint
   * @param {{*}} body
   * @returns {Promise<{*}>}
   */
  static updateDeviceInfo(apiEndpoint, body) {
    return axios.post(`${apiEndpoint}/api/streaming-games/edge-node/device-info/${DeviceInfoService.getStoredDeviceInfoId()}`, body, {
      timeout: 2500
    });
  }
}
