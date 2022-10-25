import * as sdpTransform from 'sdp-transform';

/**
 * SDP Protocol parser and editor.
 */
export default class SdpModifier {
  static get MEGABIT() {
    return 1024 * 1024;
  }

  /**
   * Create a new SDP instance for modifying SDP response before sending it to remote.
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
   * Restrict what video codec can be used.
   * @param {string[]} approvedList List of approved video codec to be used.
   */
  restrictVideoCodec(approvedList) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    const approvedRTP = video.rtp.filter((rtp) => approvedList.includes(rtp.codec));
    const ids = approvedRTP.map((rtp) => rtp.payload);
    video.rtp = approvedRTP;
    video.fmtp = video.fmtp.filter((fmtp) => ids.includes(fmtp.payload));
    video.rtcpFb = video.rtcpFb.filter((fmtp) => ids.includes(fmtp.payload));
    video.payloads = ids.join(' ');
  }

  /**
   * Give some video codecs higher priority when negotiating with the backend.
   *
   * Other codecs may still be used if the other side does not support the
   * preferred ones.
   *
   * @param {string[]} preferredCodecs The preferred video codecs, in order.
   */
  preferVideoCodec(preferredCodecs) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    const preferredRTP = preferredCodecs.reduce((acc, codec) => [...acc, ...video.rtp.filter((rtp) => rtp.codec === codec)], []);
    const otherRTP = video.rtp.filter((rtp) => !preferredCodecs.includes(rtp.codec));
    const ids = [...preferredRTP, ...otherRTP].map((rtp) => rtp.payload);
    video.payloads = ids.join(' ');
  }

  /**
   * Set the max quantization for VP8.
   * @param {number} maxQuantization Max quantization for VP8, max value is 63
   */
  setVP8MaxQuantization(maxQuantization) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    const vp8rtp = video.rtp.filter((rtp) => rtp.codec === 'VP8');
    const ids = vp8rtp.map((rtp) => rtp.payload);
    video.fmtp = [...ids.map((id) => ({ payload: id, config: `x-google-max-quantization=${maxQuantization}` })), ...video.fmtp];
  }

  /**
   * Set the start bitrate in Kbps
   * @param {number} startBitrate
   */
  setStartBitrate(startBitrate) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    const ids = video.rtp.map((rtp) => rtp.payload);
    video.fmtp = [...ids.map((id) => ({ payload: id, config: `x-google-start-bitrate=${startBitrate}` })), ...video.fmtp];
  }

  /**
   * Set the min bitrate in Kbps
   * @param {number} minBitrate
   */
  setMinBitrate(minBitrate) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    const ids = video.rtp.map((rtp) => rtp.payload);
    video.fmtp = [...ids.map((id) => ({ payload: id, config: `x-google-min-bitrate=${minBitrate}` })), ...video.fmtp];
  }

  /**
   * Set the max bitrate in Kbps
   * @param {number} maxBitrate
   */
  setMaxBitrate(maxBitrate) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    const ids = video.rtp.map((rtp) => rtp.payload);
    video.fmtp = [...ids.map((id) => ({ payload: id, config: `x-google-max-bitrate=${maxBitrate}` })), ...video.fmtp];
  }

  /**
   * Get a SDP in plain text format.
   * @return {string}
   */
  toString() {
    return sdpTransform.write(this.sdp);
  }
}
