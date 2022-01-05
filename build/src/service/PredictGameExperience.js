"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _PredictGameExperienceBase = _interopRequireDefault(require("./PredictGameExperienceBase"));

/**
 * RisingEdgeDetector class
 */
class RisingEdgeDetector {
  constructor() {
    this.isHigh = false;
  }

  next(value, threshold) {
    if (value > threshold) {
      if (!this.isHigh) {
        this.isHigh = true;
        return 1;
      } else {
        return 0;
      }
    } else {
      this.isHigh = false;
      return 0;
    }
  }

}
/**
 * RollingWindow class
 */


class RollingWindow {
  constructor(sampleSize) {
    this.sampleSize = sampleSize;
    this.values = [];
  }

  add(value) {
    this.values.push(value);

    if (this.values.length > this.sampleSize) {
      this.values.shift();
    }
  }

  getValues() {
    return this.values;
  }

  getLastValue() {
    return this.values[this.values.length - 1];
  }

}
/**
 * PredictGameExperience class
 */


class PredictGameExperience extends _PredictGameExperienceBase.default {
  constructor() {
    let sampleSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    let risingEdgeThreshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2.8;
    let longTermSampleSizeMultiplier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4;
    let predictGameExperienceSampleSizeMultiple = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1.5;
    let averageDetectionUpperRange = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.25;
    let stabilizationThreshold = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0.2;
    let roundTripTimeRisingEdgeScore = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1.5;
    let packageLostPercentageRisingEdgeScore = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    let maxRisingEdgeScore = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 1.5;
    let highRoundTripTimeGain = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 150;
    let highRoundTripTimeLowerThreshold = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 0.5;
    let risingEdgeCountGain = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 0.7;
    let risingEdgeCountPower = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : 1.25;
    let finalGain = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : 1.1;
    super();
    this.sampleSize = sampleSize;
    this.averageDetectionUpperRange = averageDetectionUpperRange;
    this.risingEdgeThreshold = risingEdgeThreshold;
    this.stabilizationThreshold = stabilizationThreshold;
    this.roundTripTimeRisingEdgeScore = roundTripTimeRisingEdgeScore;
    this.packageLostPercentageRisingEdgeScore = packageLostPercentageRisingEdgeScore;
    this.maxRisingEdgeScore = maxRisingEdgeScore;
    this.highRoundTripTimeGain = highRoundTripTimeGain;
    this.highRoundTripTimeLowerThreshold = highRoundTripTimeLowerThreshold;
    this.risingEdgeCountGain = risingEdgeCountGain;
    this.risingEdgeCountPower = risingEdgeCountPower;
    this.finalGain = finalGain;
    this.roundTripTimeLong = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.roundTripTimeShort = new RollingWindow(sampleSize);
    this.roundTripTime = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.roundTripTimeRisingEdgeDetector = new RisingEdgeDetector();
    this.roundTripTimeRisingEdge = new RollingWindow(sampleSize);
    this.packageLostPercentage = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.packageLostPercentageRisingEdgeDetector = new RisingEdgeDetector();
    this.packageLostPercentageRisingEdge = new RollingWindow(sampleSize);
    this.predictGameExperience = new RollingWindow(sampleSize * predictGameExperienceSampleSizeMultiple);
    this.count = 0;
  }
  /**
   *
   * @param {number} roundTripTime
   * @param {number} packageLostPercentage
   * @return {undefined|number}
   */


  predict(roundTripTime, packageLostPercentage) {
    this.count++;
    this.roundTripTimeLong.add(roundTripTime);
    this.roundTripTimeShort.add(roundTripTime);
    this.packageLostPercentage.add(packageLostPercentage);
    const roundTripTimeAverage = this.averageRange(this.roundTripTimeLong.getValues(), 0, this.averageDetectionUpperRange);
    const packageLostPercentageAverage = this.averageRange(this.packageLostPercentage.getValues(), 0, this.averageDetectionUpperRange);
    this.roundTripTimeRisingEdge.add(Math.min(this.roundTripTimeRisingEdgeDetector.next(roundTripTime, roundTripTimeAverage * this.risingEdgeThreshold) * this.roundTripTimeRisingEdgeScore + this.packageLostPercentageRisingEdgeDetector.next(packageLostPercentage, packageLostPercentageAverage * this.risingEdgeThreshold) * this.packageLostPercentageRisingEdgeScore, this.maxRisingEdgeScore));
    this.packageLostPercentageRisingEdge.add(this.packageLostPercentageRisingEdgeDetector.next(packageLostPercentage, packageLostPercentageAverage * this.risingEdgeThreshold));
    const risingEdgeCount = this.sum(this.roundTripTimeRisingEdge.getValues());
    this.predictGameExperience.add(5 - Math.pow(risingEdgeCount * this.risingEdgeCountGain, this.risingEdgeCountPower) * this.finalGain + Math.min(this.highRoundTripTimeLowerThreshold - this.average(this.roundTripTimeShort.getValues()) / this.highRoundTripTimeGain, 0));
    return this.count < this.sampleSize ? undefined : Math.min(Math.max(this.averageRange(this.predictGameExperience.getValues(), 0, this.stabilizationThreshold), 1), 5);
  }

  averageRange(dataset) {
    let lowerBound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    let upperBound = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    const data = [...dataset].sort((a, b) => a < b ? -1 : 1);
    return this.average(data.slice(Math.round((data.length - 1) * lowerBound), Math.round((data.length - 1) * upperBound)));
  }

  average(dataset) {
    return dataset.reduce((a, b) => a + b, 0) / dataset.length || 0;
  }

  sum(dataset) {
    return dataset.reduce((a, b) => a + b, 0);
  }

}

exports.default = PredictGameExperience;