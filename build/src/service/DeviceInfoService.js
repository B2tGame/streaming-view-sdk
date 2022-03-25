"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _axios = _interopRequireDefault(require("axios"));

var _uuid = require("uuid");

/**
 * This class is responsible for interacting with the device-info api. For example to create and update a device-info.
 */
var DeviceInfoService = /*#__PURE__*/function () {
  function DeviceInfoService() {
    (0, _classCallCheck2.default)(this, DeviceInfoService);
  }

  (0, _createClass2.default)(DeviceInfoService, null, [{
    key: "USER_ID_KEY",
    get: function get() {
      return 'streaming-appland-user-id';
    }
  }, {
    key: "DEVICE_INFO_ID_KEY",
    get: function get() {
      return 'streaming-appland-device-info-id';
    }
    /**
     * returns the stored userId stored in localStorage.
     * @returns {string|undefined}
     */

  }, {
    key: "getStoredUserId",
    value: function getStoredUserId() {
      return localStorage.getItem(DeviceInfoService.USER_ID_KEY);
    }
    /**
     * returns the deviceInfoId of the last device-info fetched from the api and stored in localStorage.
     * @returns {string|undefined}
     */

  }, {
    key: "getStoredDeviceInfoId",
    value: function getStoredDeviceInfoId() {
      return localStorage.getItem(DeviceInfoService.DEVICE_INFO_ID_KEY);
    }
    /**
     * Creates a device-info and stores its id in localstorage.
     * @param {string} apiEndpoint
     * @param {{userId: string } | undefined } body
     * @returns {Promise<{*}>}
     */

  }, {
    key: "createDeviceInfo",
    value: function createDeviceInfo(apiEndpoint) {
      var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      // If the user of this method does not provide a userId we create one and store it
      // in localStorage and use it in all subsequent calls.
      if (!body.userId) {
        var storedUserId = DeviceInfoService.getStoredUserId();

        if (storedUserId) {
          body.userId = storedUserId;
        } else {
          var userId = (0, _uuid.v4)();
          localStorage.setItem(DeviceInfoService.USER_ID_KEY, userId);
          body.userId = userId;
        }
      }

      return _axios.default.post("".concat(apiEndpoint, "/api/streaming-games/edge-node/device-info"), body, {
        timeout: 3000
      }).then(function (result) {
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

  }, {
    key: "updateDeviceInfo",
    value: function updateDeviceInfo(apiEndpoint, body) {
      var _context;

      return _axios.default.post((0, _concat.default)(_context = "".concat(apiEndpoint, "/api/streaming-games/edge-node/device-info/")).call(_context, DeviceInfoService.getStoredDeviceInfoId()), body, {
        timeout: 3000
      });
    }
  }]);
  return DeviceInfoService;
}();

exports.default = DeviceInfoService;