import axios from 'axios';
import log from '../Logger';
import { v4 as uuid } from 'uuid';

const USER_ID_KEY = 'streaming-appland-user-id';

/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @param {{vip: boolean, vendor: string, overflowToPublicDataCenters: boolean}} userConfiguration
 * @returns {Promise<{}>}
 */
function get(apiEndpoint, userConfiguration) {
  const DPI = window.devicePixelRatio || 1;

  const browserDeviceInfo = {
    screenScale: DPI,
    screenWidth: Math.round(DPI * window.screen.width),
    screenHeight: Math.round(DPI * window.screen.height),
    viewportWidth: Math.round(DPI * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)),
    viewportHeight: Math.round(DPI * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)),
  };

  const userId = localStorage.getItem(USER_ID_KEY) || uuid();

  localStorage.setItem(USER_ID_KEY, userId);

  const body = {
    userId,
    userConfiguration,
  };

  return axios.post(`${apiEndpoint}/api/streaming-games/edge-node/device-info`, body, { timeout: 3000 }).then((result) => {
    const deviceInfo = { ...result.data, ...browserDeviceInfo };

    log.info('deviceInfo is ready', deviceInfo);

    return deviceInfo;
  });
}

/**
 * Update the last created device-info
 * @param {{*}} body
 * @param {string} apiEndpoint
 * @returns {Promise<{*}>}
 */
function update(apiEndpoint, deviceInfoId, body) {
  return axios.post(`${apiEndpoint}/api/streaming-games/edge-node/device-info/${deviceInfoId}`, body, {
    timeout: 3000,
  });
}

export default { get, update };
