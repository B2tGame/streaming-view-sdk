"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "StreamingAgent", {
  enumerable: true,
  get: function get() {
    return _StreamingAgent.default;
  }
});
Object.defineProperty(exports, "StreamingController", {
  enumerable: true,
  get: function get() {
    return _StreamingController.default;
  }
});
Object.defineProperty(exports, "StreamingEvent", {
  enumerable: true,
  get: function get() {
    return _StreamingEvent.default;
  }
});
Object.defineProperty(exports, "StreamingView", {
  enumerable: true,
  get: function get() {
    return _StreamingView.default;
  }
});

var _StreamingView = _interopRequireDefault(require("./src/StreamingView"));

var _StreamingController = _interopRequireDefault(require("./src/StreamingController"));

var _StreamingAgent = _interopRequireDefault(require("./src/StreamingAgent"));

var _StreamingEvent = _interopRequireDefault(require("./src/StreamingEvent"));

var _buildInfo = _interopRequireDefault(require("./src/build-info.json"));

(window || {}).applandStreamingSdkVersion = _buildInfo.default.tag;
/**
 * Streaming View SDK
 */