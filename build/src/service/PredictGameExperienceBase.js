"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint-disable no-unused-vars */

/**
 * PredictGameExperienceBase class
 */
class PredictGameExperienceBase {
  predict(roundTripTime) {
    let packageLostPercentage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
    throw new Error('You must override PredictGameExperienceBase.predict function');
  }

}

exports.default = PredictGameExperienceBase;