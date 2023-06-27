/**
 * RisingEdgeDetector class
 */
class RisingEdgeDetector {
  isHigh = false;

  next(value: number, threshold: number) {
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
  values: number[] = [];

  constructor(public sampleSize: number) {}

  add(value: number) {
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
export default class PredictGameExperience {
  static get ALGORITHM_NAME() {
    return 'alpha';
  }

  count = 0;
  roundTripTimeLong: RollingWindow;
  roundTripTimeShort: RollingWindow;
  roundTripTime: RollingWindow;
  roundTripTimeRisingEdgeDetector = new RisingEdgeDetector();
  roundTripTimeRisingEdge: RollingWindow;

  packageLostPercentage: RollingWindow;
  packageLostPercentageRisingEdgeDetector = new RisingEdgeDetector();
  packageLostPercentageRisingEdge: RollingWindow;

  predictGameExperience: RollingWindow;

  constructor(
    public sampleSize = 10,
    public risingEdgeThreshold = 2.8,
    longTermSampleSizeMultiplier = 4,
    predictGameExperienceSampleSizeMultiple = 1.5,
    public averageDetectionUpperRange = 0.25,
    public stabilizationThreshold = 0.2,
    public roundTripTimeRisingEdgeScore = 1.5, // 1
    public packageLostPercentageRisingEdgeScore = 0, // 0.8
    public maxRisingEdgeScore = 1.5,
    public highRoundTripTimeGain = 150,
    public highRoundTripTimeLowerThreshold = 0.5,
    public risingEdgeCountGain = 0.7, // 0.6
    public risingEdgeCountPower = 1.25,
    public finalGain = 1.1
  ) {
    this.roundTripTimeLong = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.roundTripTimeShort = new RollingWindow(sampleSize);
    this.roundTripTime = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.roundTripTimeRisingEdge = new RollingWindow(sampleSize);

    this.packageLostPercentage = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.packageLostPercentageRisingEdge = new RollingWindow(sampleSize);

    this.predictGameExperience = new RollingWindow(sampleSize * predictGameExperienceSampleSizeMultiple);
  }

  predict(roundTripTime: number, packageLostPercentage: number) {
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
      : this.averageRange(this.predictGameExperience.getValues(), 0, this.stabilizationThreshold);
  }

  averageRange(dataset: number[], lowerBound = 0, upperBound = 1) {
    const data = [...dataset].sort((a, b) => (a < b ? -1 : 1));
    return this.average(data.slice(Math.round((data.length - 1) * lowerBound), Math.round((data.length - 1) * upperBound)));
  }

  average(dataset: number[]) {
    return dataset.reduce((a, b) => a + b, 0) / dataset.length || 0;
  }

  sum(dataset: number[]) {
    return dataset.reduce((a, b) => a + b, 0);
  }
}
