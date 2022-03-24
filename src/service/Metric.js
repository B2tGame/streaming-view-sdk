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
      requiredWindow: 1250
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
      requiredWindow: 4000
    };
  }

  /**
   * The avg data over time 2000 to 7000ms
   * @constructor
   */
  static get OVERALL() {
    return {
      id: 'overall',
      start: 4500,
      end: 24 * 60 * 60 * 1000, // 24 hours
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
    return [Metric.START, Metric.BEGINNING, Metric.OVERALL, Metric.CURRENT];
  }

  constructor() {
    this.refTimestamp = undefined;
    this._eventHandler = new EventTarget();
  }

  /**
   * Trigger event on specific metric starting / ending
   * @param { 'startEnd' | 'beginningEnd' | 'overallEnd' |'currentEnd' } eventName Event name refers to the names of metric + start or end
   * @param {() => {}} callback To be called when event is emitted
   */
  on(eventName, callback) {
    this._eventHandler.addEventListener(eventName, callback);
  }

  onMetricPeriodEnd(callback) {
    Metric.ALL_METRICS.forEach((metric) => {
      this.on(`${metric.id}End`, callback);
    });
  }

  offMetricPeriodEnd(callback) {
    Metric.ALL_METRICS.forEach((metric) => {
      this.off(`${metric.id}End`, callback);
    });
  }

  /**
   * Trigger event on specific metric starting / ending
   * @param { 'startEnd' | 'beginningEnd' | 'overallEnd' |'currentEnd' } eventName Event name refers to the names of metric + start or end
   * @param {() => {}} callback Must be the SAME function (by reference) as the registered function, to be unregistered
   */
  off(eventName, callback) {
    this._eventHandler.addEventListener(eventName, callback);
  }

  /**
   * Trigger event on specific metric starting / ending
   * @param { 'startEnd' | 'beginningEnd' | 'overallEnd' |'currentEnd' } eventName Event name refers to the names of metric + start or end
     @param {() => {}} data is some payload that we want to add to the event
  */
  dispatch(eventName, data = undefined) {
    this._eventHandler.dispatchEvent(new CustomEvent(eventName, data));
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
        ended: false,
        firstValueTime: undefined,
        lastValueTime: undefined
      };
    }
  }

  /**
   * Get if reference time has been set or not.
   * @return {boolean}
   */
  hasReferenceTime() {
    return this.refTimestamp !== undefined;
  }

  /**
   * Get the current time against the reference time
   * @param timestamp
   * @return {number}
   */
  getReferenceTime(timestamp = undefined) {
    return (timestamp || Date.now()) - this.refTimestamp;
  }

  /**
   * Inject a new value to the metric.
   * @param {number} value
   * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   */
  inject(value, timestamp = undefined) {
    if (Number.isFinite(value) && this.refTimestamp !== undefined) {
      const currentTimestamp = this.getReferenceTime(timestamp);

      for (let item of Metric.ALL_METRICS) {
        if (item.mode === 'start') {
          if (item.start <= currentTimestamp && item.end >= currentTimestamp) {
            const metric = this.metrics[item.id];

            metric.raw.push({ timestamp: currentTimestamp, value: value });
            metric.firstValueTime = metric.firstValueTime === undefined ? currentTimestamp : metric.firstValueTime;
            metric.lastValueTime = currentTimestamp;
            metric.sum += value;
            metric.count += 1;
          } else if (item.start <= currentTimestamp && !item.ended) {
            item.ended = true;
            this.dispatch(`${item.id}End`);
          }
        } else if (item.mode === 'end') {
          const metric = this.metrics[item.id];
          metric.raw.push({ timestamp: currentTimestamp, value: value });

          metric.raw = metric.raw.filter((rec) => currentTimestamp - rec.timestamp < -item.start);
          metric.firstValueTime = metric.firstValueTime === undefined ? currentTimestamp : metric.firstValueTime;
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
    if (key && key.id && this.hasReferenceTime()) {
      const metric = this.metrics[key.id];
      if (metric && metric.lastValueTime - metric.firstValueTime >= key.requiredWindow) {
        if (key.mode === 'start') {
          return metric.sum / metric.count;
        } else if (key.mode === 'end') {
          const currentTimestamp = this.getReferenceTime(timestamp);
          const metrics = metric.raw
            .filter((rec) => currentTimestamp - rec.timestamp <= -key.start)
            .filter((rec) => currentTimestamp - rec.timestamp >= -key.end)
            .map((rec) => rec.value);
          return metrics.reduce((a, b) => a + b, 0) / metrics.length;
        }
      }
    }
    return undefined;
  }
}
