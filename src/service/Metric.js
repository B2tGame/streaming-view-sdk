export default class Metric {

  /**
   * The avg data over time 0 to 2000 ms
   * @constructor
   */
  static get START() {
    return {
      id: 'start',
      start: 0,
      end: 2000,
      mode: 'start',
      requiredWindow: 1500
    };
  }

  /**
   * The avg data over time 2000 to 7000ms
   * @constructor
   */
  static get BEGINNING() {
    return {
      id: 'beginning',
      start: 2000,
      end: 7000,
      mode: 'start',
      requiredWindow: 4500
    };
  }


  static get CURRENT() {
    return {
      id: 'current',
      start: -5000,
      end: 0,
      mode: 'end',
      requiredWindow: 2500
    };
  }


  static get ALL_METRICS() {
    return [Metric.START, Metric.BEGINNING, Metric.CURRENT];
  }

  constructor() {
    this.refTimestamp = undefined;
  }


  /**
   * Set the zero reference timestamp
   * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   */
  setReferenceTime(timestamp = undefined) {
    this.refTimestamp = timestamp || Date.now();
    this.metrics = {};
    for (let item of Metric.ALL_METRICS) {
      this.metrics[item.id] = {
        sum: 0,
        count: 0,
        raw: [],
        firstValueTime: undefined,
        lastValueTime: undefined
      };
    }
  }

  getReferenceTime(timestamp = undefined) {
    return (timestamp || Date.now()) - this.refTimestamp;
  }

  inject(value, timestamp = undefined) {
    if (this.refTimestamp !== undefined) {
      const currentTimestamp = this.getReferenceTime(timestamp);

      for (let item of Metric.ALL_METRICS) {

        if (item.mode === 'start') {
          if (item.start <= currentTimestamp && item.end >= currentTimestamp) {
            const metric = this.metrics[item.id];
            metric.firstValueTime = metric.firstValueTime === undefined ? currentTimestamp : metric;
            metric.lastValueTime = currentTimestamp;
            metric.sum += value;
            metric.count += 1;
          }
        } else if (item.mode === 'end') {
          const metric = this.metrics[item.id];
          metric.raw.push({ timestamp: currentTimestamp, value: value });
          metric.raw = metric.raw.filter((rec) => (currentTimestamp - rec.currentTimestamp) < -item.start);
          metric.firstValueTime = metric.firstValueTime === undefined ? currentTimestamp : metric;
          metric.lastValueTime = currentTimestamp;
          metric.count = metric.raw.length;
        }
      }
    }
  }


  /**
   * Get a metric key
   * @param {Metric.START|Metric.BEGINNING|Metric.CURRENT} key
   * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   * @return {number}
   */
  getMetric(key, timestamp = undefined) {
    const metric = this.metrics[key.id];
    if (metric && (metric.lastValueTime - metric.firstValueTime) >= key.requiredWindow) {
      if (key.mode === 'start') {
        return metric.sum / metric.count;
      } else if (key.mode === 'end') {
        const currentTimestamp = this.getReferenceTime(timestamp);
        const metrics = metric.raw
          .filter((rec) => (currentTimestamp - rec.currentTimestamp) <= -key.start)
          .filter((rec) => (currentTimestamp - rec.currentTimestamp) >= -key.end)
          .map((rec) => rec.value);
        return metrics.reduce((a, b) => a + b, 0) / metrics;
      }
    }
    return undefined;
  }
}

