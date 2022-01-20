"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

/* eslint-disable no-unused-vars */

/**
 * PredictGameExperienceBase class
 */
var PredictGameExperienceBase = /*#__PURE__*/function () {
  function PredictGameExperienceBase() {
    (0, _classCallCheck2.default)(this, PredictGameExperienceBase);
  }

  (0, _createClass2.default)(PredictGameExperienceBase, [{
    key: "predict",
    value: function predict(roundTripTime) {
      var packageLostPercentage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
      throw new Error('You must override PredictGameExperienceBase.predict function');
    }
  }]);
  return PredictGameExperienceBase;
}();

exports.default = PredictGameExperienceBase;