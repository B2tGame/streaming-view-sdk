"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

_Object$defineProperty(exports, "getDeviceInfo", {
  enumerable: true,
  get: function get() {
    return _deviceInfo.getDeviceInfo;
  }
});

_Object$defineProperty(exports, "getNetworkDeviceInfo", {
  enumerable: true,
  get: function get() {
    return _deviceInfo.getNetworkDeviceInfo;
  }
});

_Object$defineProperty(exports, "resetDeviceInfo", {
  enumerable: true,
  get: function get() {
    return _deviceInfo.resetDeviceInfo;
  }
});

_Object$defineProperty(exports, "updateDeviceInfo", {
  enumerable: true,
  get: function get() {
    return _deviceInfo.updateDeviceInfo;
  }
});

var _deviceInfo = require("../../measurements/service/deviceInfo");