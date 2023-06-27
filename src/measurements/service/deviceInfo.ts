import axios, { AxiosResponse } from 'axios';
import * as log from '../Logger';
import { v4 as uuid } from 'uuid';

const USER_ID_KEY = 'streaming-appland-user-id';

export type DeviceConfiguration = {
  vip?: boolean;
  vendor: string;
  overflowToPublicDataCenter?: boolean;
};

type DeviceInfoResponse = {
  // UUID
  deviceInfoId: string;
  // UUID
  userId: string;
  userAgent: UserAgent;
  os: string;
  device: string;
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  recommendation: [EdgeRegionRecommendation];
  createdAt: number;
  updatedAt: number;
};

type UserAgent = {
  userAgent: string;
  browserName: string;
  browserVersion: string;
  browserMajor: string;
  engineName: string;
  engineVersion: string;
  osName: string;
  osVersion: string;
  cpuArchitecture: string;
};

type BrowserDeviceInfo = {
  screenScale: number;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
};

type EdgeRegionRecommendation = {
  edgeRegion: string;
  measurementEndpoints: string[];
};

export type DeviceInfo = DeviceInfoResponse & BrowserDeviceInfo;
/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 */
export async function get(apiEndpoint: string, userConfiguration: DeviceConfiguration, userAuthToken: string) {
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

  const result = await axios.post<typeof body, AxiosResponse<DeviceInfoResponse>>(
    `${apiEndpoint}/api/streaming-games/edge-node/device-info`,
    body,
    {
      timeout: 3000,
      headers: { Authorization: `Bearer ${userAuthToken}` },
    }
  );

  const deviceInfo: DeviceInfo = { ...result.data, ...browserDeviceInfo };
  log.info('deviceInfo is ready', deviceInfo);
  return deviceInfo;
}

/**
 * Update the last created device-info
 * @param {string} apiEndpoint
 * @param {string} deviceInfoId
 * @param {string} userAuthToken
 * @param {{*}} body
 * @returns {Promise<{*}>}
 */
export function update(apiEndpoint: string, deviceInfoId: string, userAuthToken: string, body: object) {
  return axios.post<any, AxiosResponse<DeviceInfoResponse>>(
    `${apiEndpoint}/api/streaming-games/edge-node/device-info/${deviceInfoId}`,
    body,
    {
      timeout: 3000,
      headers: { Authorization: `Bearer ${userAuthToken}` },
    }
  );
}
