import UAParser from 'ua-parser-js'

/**
 * thin wrapper around UAParser, for full info about browsers and devices, see:
 * https://github.com/faisalman/ua-parser-js#methods
 */
export default class DeviceInfo {

  static supportedBrowsers = [
    'safari',
    'mobile safari',
    'chrome',
    'chrome headless',
    // 'chrome webview', // ?
  ]

  constructor() {
    this.userAgentInfo = new UAParser();  
  }

  /** 
   * @returns {UAParser.IResult}
  */

  get UA () {
    return this.userAgentInfo.getResult()
  }

  getBrowserName() {
    return this.UA.browser.name ?? ''
  }

  isSupportedBrowser() {
    return DeviceInfo.supportedBrowsers.includes(
      this.getBrowserName().toLocaleLowerCase()
    )
  }

}
