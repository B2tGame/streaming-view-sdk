"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

_Object$defineProperty(exports, "StreamingController", {
  enumerable: true,
  get: function get() {
    return _StreamingController.default;
  }
});

_Object$defineProperty(exports, "StreamingEvent", {
  enumerable: true,
  get: function get() {
    return _StreamingEvent.default;
  }
});

_Object$defineProperty(exports, "StreamingView", {
  enumerable: true,
  get: function get() {
    return _StreamingView.default;
  }
});

var _StreamingView = _interopRequireDefault(require("./src/controllers/StreamingView"));

var _StreamingController = _interopRequireDefault(require("./src/controllers/StreamingController"));

var _StreamingEvent = _interopRequireDefault(require("./src/controllers/StreamingEvent"));

var _buildInfo = _interopRequireDefault(require("./src/controllers/build-info.json"));

(window || {}).applandStreamingSdkVersion = _buildInfo.default.tag;
/**
 * Streaming View SDK
 */