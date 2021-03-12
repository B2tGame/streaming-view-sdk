import * as sdpTransform from 'sdp-transform';

/**
 * SDP Protocol parser and editor.
 */
export default class SDP {

  static get MEGABIT() {
    return 1024 * 1024;
  }

  /**
   * Create a new SDP instances for modify SDP response before sending it to remote.
   * @param {string} sdp
   */
  constructor(sdp) {
    this.sdp = sdpTransform.parse(sdp);
  }

  /**
   * Set target bandwidth in bit per sec for each channel.
   * @param {number|undefined} videoBitPerSecSecond Target bandwidth in bit per second
   * @param {number | undefined} audioBitPerSecond Target bandwidth in bit per second
   */
  setTargetBandwidth(videoBitPerSecSecond = undefined, audioBitPerSecond = undefined) {
    if (videoBitPerSecSecond) {
      const video = this.sdp.media.find((media) => media.type === 'video');
      video.bandwidth = [{ type: 'AS', limit: Math.trunc(videoBitPerSecSecond / 1024) }];
    }
    if (audioBitPerSecond) {
      const audio = this.sdp.media.find((media) => media.type === 'audio');
      audio.bandwidth = [{ type: 'AS', limit: Math.trunc(audioBitPerSecond / 1024) }];
    }
  }

  /**
   * Get a SDP in plain text format.
   * @return {string}
   */
  toString() {
    return sdpTransform.write(this.sdp);
  }
}
