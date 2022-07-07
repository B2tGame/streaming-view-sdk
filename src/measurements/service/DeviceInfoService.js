import axios from 'axios';
import { v4 as uuid } from 'uuid';

/**
 * This class is responsible for interacting with the device-info api. For example to create and update a device-info.
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
   * returns the deviceInfoId of the last device-info fetched from the api and stored in localStorage.
   * @returns {string|undefined}
   */
  static getStoredDeviceInfoId() {
    return localStorage.getItem(DeviceInfoService.DEVICE_INFO_ID_KEY);
  }

  /**
   * Creates a device-info and stores its id in localstorage.
   * @param {string} apiEndpoint
   * @param {{userId: string } | undefined } body
   * @returns {Promise<{*}>}
   */
  static createDeviceInfo(apiEndpoint, body = {}) {
    // If the user of this method does not provide a userId we create one and store it
    // in localStorage and use it in all subsequent calls.
    if (!body.userId) {
      const storedUserId = DeviceInfoService.getStoredUserId();
      if (storedUserId) {
        body.userId = storedUserId;
      } else {
        const userId = uuid();
        localStorage.setItem(DeviceInfoService.USER_ID_KEY, userId);
        body.userId = userId;
      }
    }

    return axios.post(`${apiEndpoint}/api/streaming-games/edge-node/device-info`, body, { timeout: 3000 }).then((result) => {
      // deviceInfoId is stored in localStorage. Later it will be used to update the device-info with new data.
      localStorage.setItem(DeviceInfoService.DEVICE_INFO_ID_KEY, result.data.deviceInfoId);
      return result.data;
    });
  }

  /**
   * Update the last created device-info
   * @param {string} apiEndpoint
   * @param {{*}} body
   * @returns {Promise<{*}>}
   */
  static updateDeviceInfo(apiEndpoint, body) {
    return axios.post(`${apiEndpoint}/api/streaming-games/edge-node/device-info/${DeviceInfoService.getStoredDeviceInfoId()}`, body, {
      timeout: 3000,
    });
  }
}
