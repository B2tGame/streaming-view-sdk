"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var sdpTransform = _interopRequireWildcard(require("sdp-transform"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * SDP Protocol parser and editor.
 */
class SdpModifier {
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


  setTargetBandwidth() {
    let videoBitPerSecSecond = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    let audioBitPerSecond = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

    if (videoBitPerSecSecond) {
      const video = this.sdp.media.find(media => media.type === 'video');
      video.bandwidth = [{
        type: 'AS',
        limit: Math.trunc(videoBitPerSecSecond / 1024)
      }];
    }

    if (audioBitPerSecond) {
      const audio = this.sdp.media.find(media => media.type === 'audio');
      audio.bandwidth = [{
        type: 'AS',
        limit: Math.trunc(audioBitPerSecond / 1024)
      }];
    }
  }
  /**
   * Restrict what video codec can be used.
   * @param {string[]} approvedList, List of approved video codec to be used.
   */


  restrictVideoCodec(approvedList) {
    const video = this.sdp.media.find(media => media.type === 'video');
    const approvedRTP = video.rtp.filter(rtp => approvedList.includes(rtp.codec));
    const ids = approvedRTP.map(rtp => rtp.payload);
    video.rtp = approvedRTP;
    video.fmtp = video.fmtp.filter(fmtp => ids.includes(fmtp.payload));
    video.rtcpFb = video.rtcpFb.filter(fmtp => ids.includes(fmtp.payload));
    video.payloads = ids.join(' ');
  }
  /**
   * Get a SDP in plain text format.
   * @return {string}
   */


  toString() {
    return sdpTransform.write(this.sdp);
  }

}

exports.default = SdpModifier;