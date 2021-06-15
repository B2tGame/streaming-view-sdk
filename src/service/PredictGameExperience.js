import PredictGameExperienceBase from './PredictGameExperienceBase';

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
export default class PredictGameExperience extends PredictGameExperienceBase {
  constructor(
    sampleSize = 10,
    risingEdgeThreshold = 2.8,
    longTermSampleSizeMultiplier = 4,
    predictGameExperienceSampleSizeMultiple = 1.5,
    averageDetectionUpperRange = 0.25,
    stabilizationThreshold = 0.2,
    roundTripTimeRisingEdgeScore = 1.5, // 1
    packageLostPercentageRisingEdgeScore = 0, // 0.8
    maxRisingEdgeScore = 1.5,
    highRoundTripTimeGain = 150,
    highRoundTripTimeLowerThreshold = 0.5,
    risingEdgeCountGain = 0.7, // 0.6
    risingEdgeCountPower = 1.25,
    finalGain = 1.1
  ) {
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
    this.roundTripTimeRisingEdge.add(
      Math.min(
        this.roundTripTimeRisingEdgeDetector.next(roundTripTime, roundTripTimeAverage * this.risingEdgeThreshold) *
          this.roundTripTimeRisingEdgeScore +
          this.packageLostPercentageRisingEdgeDetector.next(
            packageLostPercentage,
            packageLostPercentageAverage * this.risingEdgeThreshold
          ) *
            this.packageLostPercentageRisingEdgeScore,
        this.maxRisingEdgeScore
      )
    );
    this.packageLostPercentageRisingEdge.add(
      this.packageLostPercentageRisingEdgeDetector.next(packageLostPercentage, packageLostPercentageAverage * this.risingEdgeThreshold)
    );
    const risingEdgeCount = this.sum(this.roundTripTimeRisingEdge.getValues());
    this.predictGameExperience.add(
      5 -
        Math.pow(risingEdgeCount * this.risingEdgeCountGain, this.risingEdgeCountPower) * this.finalGain +
        Math.min(this.highRoundTripTimeLowerThreshold - this.average(this.roundTripTimeShort.getValues()) / this.highRoundTripTimeGain, 0)
    );

    return this.count < this.sampleSize
      ? undefined
      : Math.min(Math.max(this.averageRange(this.predictGameExperience.getValues(), 0, this.stabilizationThreshold), 1), 5);
  }

  averageRange(dataset, lowerBound = 0, upperBound = 1) {
    const data = [...dataset].sort((a, b) => (a < b ? -1 : 1));
    return this.average(data.slice(Math.round((data.length - 1) * lowerBound), Math.round((data.length - 1) * upperBound)));
  }

  average(dataset) {
    return dataset.reduce((a, b) => a + b, 0) / dataset.length || 0;
  }

  sum(dataset) {
    return dataset.reduce((a, b) => a + b, 0);
  }
}
