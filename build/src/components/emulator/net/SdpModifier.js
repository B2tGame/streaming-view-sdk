"use strict";

var _typeof = require("@babel/runtime-corejs3/helpers/typeof");

var _WeakMap = require("@babel/runtime-corejs3/core-js-stable/weak-map");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/find"));

var _trunc = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/math/trunc"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var sdpTransform = _interopRequireWildcard(require("sdp-transform"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * SDP Protocol parser and editor.
 */
var SdpModifier = /*#__PURE__*/function () {
  /**
   * Create a new SDP instance for modifying SDP response before sending it to remote.
   * @param {string} sdp
   */
  function SdpModifier(sdp) {
    (0, _classCallCheck2["default"])(this, SdpModifier);
    this.sdp = sdpTransform.parse(sdp);
  }
  /**
   * Set target bandwidth in bit per sec for each channel.
   * @param {number|undefined} videoBitPerSecSecond Target bandwidth in bit per second
   * @param {number | undefined} audioBitPerSecond Target bandwidth in bit per second
   */


  (0, _createClass2["default"])(SdpModifier, [{
    key: "setTargetBandwidth",
    value: function setTargetBandwidth() {
      var videoBitPerSecSecond = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      var audioBitPerSecond = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (videoBitPerSecSecond) {
        var _context;

        var video = (0, _find["default"])(_context = this.sdp.media).call(_context, function (media) {
          return media.type === 'video';
        });
        video.bandwidth = [{
          type: 'AS',
          limit: (0, _trunc["default"])(videoBitPerSecSecond / 1024)
        }];
      }

      if (audioBitPerSecond) {
        var _context2;

        var audio = (0, _find["default"])(_context2 = this.sdp.media).call(_context2, function (media) {
          return media.type === 'audio';
        });
        audio.bandwidth = [{
          type: 'AS',
          limit: (0, _trunc["default"])(audioBitPerSecond / 1024)
        }];
      }
    }
    /**
     * Restrict what video codec can be used.
     * @param {string[]} approvedList, List of approved video codec to be used.
     */

  }, {
    key: "restrictVideoCodec",
    value: function restrictVideoCodec(approvedList) {
      var _context3, _context4, _context5, _context6;

      var video = (0, _find["default"])(_context3 = this.sdp.media).call(_context3, function (media) {
        return media.type === 'video';
      });
      var approvedRTP = (0, _filter["default"])(_context4 = video.rtp).call(_context4, function (rtp) {
        return (0, _includes["default"])(approvedList).call(approvedList, rtp.codec);
      });
      var ids = (0, _map["default"])(approvedRTP).call(approvedRTP, function (rtp) {
        return rtp.payload;
      });
      video.rtp = approvedRTP;
      video.fmtp = (0, _filter["default"])(_context5 = video.fmtp).call(_context5, function (fmtp) {
        return (0, _includes["default"])(ids).call(ids, fmtp.payload);
      });
      video.rtcpFb = (0, _filter["default"])(_context6 = video.rtcpFb).call(_context6, function (fmtp) {
        return (0, _includes["default"])(ids).call(ids, fmtp.payload);
      });
      video.payloads = ids.join(' ');
    }
    /**
     * Set the max quantization for VP8.
     * @param {number} maxQuantization Max quantization for VP8, max value is 63
     */

  }, {
    key: "setVP8MaxQuantization",
    value: function setVP8MaxQuantization(maxQuantization) {
      var _context7, _context8, _context9;

      var video = (0, _find["default"])(_context7 = this.sdp.media).call(_context7, function (media) {
        return media.type === 'video';
      });
      var vp8rtp = (0, _filter["default"])(_context8 = video.rtp).call(_context8, function (rtp) {
        return rtp.codec === 'VP8';
      });
      var ids = (0, _map["default"])(vp8rtp).call(vp8rtp, function (rtp) {
        return rtp.payload;
      });
      video.fmtp = (0, _concat["default"])(_context9 = []).call(_context9, (0, _toConsumableArray2["default"])((0, _map["default"])(ids).call(ids, function (id) {
        return {
          payload: id,
          config: "x-google-max-quantization=".concat(maxQuantization)
        };
      })), (0, _toConsumableArray2["default"])(video.fmtp));
    }
    /**
     * Get a SDP in plain text format.
     * @return {string}
     */

  }, {
    key: "toString",
    value: function toString() {
      return sdpTransform.write(this.sdp);
    }
  }], [{
    key: "MEGABIT",
    get: function get() {
      return 1024 * 1024;
    }
  }]);
  return SdpModifier;
}();

exports["default"] = SdpModifier;