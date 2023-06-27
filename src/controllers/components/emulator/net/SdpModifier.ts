import * as sdpTransform from 'sdp-transform';

/**
 * SDP Protocol parser and editor.
 */
export default class SdpModifier {
  sdp: sdpTransform.SessionDescription;

  static get MEGABIT() {
    return 1024 * 1024;
  }

  /**
   * Create a new SDP instance for modifying SDP response before sending it to remote.
   * @param {string} sdp
   */
  constructor(sdp: string) {
    this.sdp = sdpTransform.parse(sdp);
  }

  /**
   * Set target bandwidth in bit per sec for each channel.
   * @param {number|undefined} videoBitPerSecSecond Target bandwidth in bit per second
   * @param {number | undefined} audioBitPerSecond Target bandwidth in bit per second
   */
  setTargetBandwidth(videoBitPerSecSecond?: number, audioBitPerSecond?: number) {
    if (videoBitPerSecSecond) {
      const video = this.sdp.media.find((media) => media.type === 'video');
      if (!video) {
        throw new Error('Could not access video media');
      }
      video.bandwidth = [{ type: 'AS', limit: Math.trunc(videoBitPerSecSecond / 1024) }];
    }
    if (audioBitPerSecond) {
      const audio = this.sdp.media.find((media) => media.type === 'audio');
      if (!audio) {
        throw new Error('Could not access audio media');
      }
      audio.bandwidth = [{ type: 'AS', limit: Math.trunc(audioBitPerSecond / 1024) }];
    }
    return this;
  }

  /**
   * Restrict what video codec can be used.
   * @param {string[]} approvedList List of approved video codec to be used.
   */
  restrictVideoCodec(approvedList: string[]) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    if (!video) {
      throw new Error('Could not access video media');
    }
    const approvedRTP = video.rtp.filter((rtp) => approvedList.includes(rtp.codec));
    const ids = approvedRTP.map((rtp) => rtp.payload);
    video.rtp = approvedRTP;
    video.fmtp = video.fmtp.filter((fmtp) => ids.includes(fmtp.payload));
    video.rtcpFb = video.rtcpFb?.filter((fmtp) => ids.includes(fmtp.payload)) ?? [];
    video.payloads = ids.join(' ');
    return this;
  }

  /**
   * Give some video codecs higher priority when negotiating with the backend.
   *
   * Other codecs may still be used if the other side does not support the
   * preferred ones.
   *
   * @param {string[]} preferredCodecs The preferred video codecs, in order.
   */
  preferVideoCodec(preferredCodecs: string[]) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    if (!video) {
      throw new Error('Could not access video media');
    }
    const preferredRTP = preferredCodecs.reduce((acc, codec) => [...acc, ...video.rtp.filter((rtp) => rtp.codec === codec)], []);
    const otherRTP = video.rtp.filter((rtp) => !preferredCodecs.includes(rtp.codec));
    const ids = [...preferredRTP, ...otherRTP].map((rtp) => rtp.payload);
    video.payloads = ids.join(' ');
    return this;
  }

  /**
   * Set the max quantization for VP8.
   * @param {number} maxQuantization Max quantization for VP8, max value is 63
   */
  setVP8MaxQuantization(maxQuantization: number) {
    const video = this.sdp.media.find((media) => media.type === 'video');
    if (!video) {
      throw new Error('Could not access video media');
    }
    const vp8rtp = video.rtp.filter((rtp) => rtp.codec === 'VP8');
    const ids = vp8rtp.map((rtp) => rtp.payload);
    video.fmtp = [...ids.map((id) => ({ payload: id, config: `x-google-max-quantization=${maxQuantization}` })), ...video.fmtp];
    return this;
  }

  /**
   * Get a SDP in plain text format.
   * @return {string}
   */
  toString() {
    return sdpTransform.write(this.sdp);
  }
}
