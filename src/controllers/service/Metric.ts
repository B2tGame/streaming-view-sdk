export type MetricName = typeof Metric.ALL_METRICS[number]['id'];
export type MetricData = {
  [key in MetricName]: {
    sum: number;
    count: number;
    raw: { timestamp: number; value: number }[];
    ended: boolean;
    firstValueTime?: number;
    lastValueTime?: number;
  };
};

export type MetricEventHandler = (evt: CustomEvent) => void;

export default class Metric {
  metrics: MetricData;
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
      ended: false,
      requiredWindow: 1250,
    } as const;
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
      ended: false,
      requiredWindow: 4000,
    } as const;
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
      ended: false,
      requiredWindow: 4500,
    } as const;
  }

  static get CURRENT() {
    return {
      id: 'current',
      start: -5000,
      end: 0,
      mode: 'end',
      ended: false,
      requiredWindow: 2500,
    } as const;
  }

  static get ALL_METRICS() {
    return [Metric.START, Metric.BEGINNING, Metric.OVERALL, Metric.CURRENT];
  }

  refTimestamp?: number;
  private _eventHandler: EventTarget;

  constructor() {
    this._eventHandler = new EventTarget();
  }

  /**
   * Trigger event on specific metric starting / ending
   * @param eventName Event name refers to the names of metric + start or end
   * @param callback To be called when event is emitted
   */
  on(eventName: `${MetricName}-end`, callback: MetricEventHandler) {
    this._eventHandler.addEventListener(eventName, callback);
  }

  onMetricPeriodEnd(callback: MetricEventHandler) {
    Metric.ALL_METRICS.forEach((metric) => {
      this.on(`${metric.id}-end`, callback);
    });
  }

  offMetricPeriodEnd(callback: MetricEventHandler) {
    Metric.ALL_METRICS.forEach((metric) => {
      this.off(`${metric.id}-end`, callback);
    });
  }

  /**
   * Trigger event on specific metric starting / ending
   * @param eventName Event name refers to the names of metric + start or end
   * @param callback Must be the SAME function (by reference) as the registered function, to be unregistered
   */
  off(eventName: `${MetricName}-end`, callback: MetricEventHandler) {
    this._eventHandler.addEventListener(eventName, callback);
  }

  /**
   * Trigger event on specific metric starting / ending
   * @param eventName Event name refers to the names of metric + start or end
     @param  data is some payload that we want to add to the event
  */
  dispatch(eventName: `${MetricName}-end`, data?: any) {
    this._eventHandler.dispatchEvent(new CustomEvent(eventName, data));
  }

  /**
   * Set the zero reference timestamp
   * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   */
  setReferenceTime(timestamp?: number) {
    this.refTimestamp = timestamp || Date.now();
    for (let item of Metric.ALL_METRICS) {
      this.metrics[item.id] = {
        sum: 0,
        count: 0,
        raw: [],
        ended: false,
        firstValueTime: undefined,
        lastValueTime: undefined,
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
   */
  getReferenceTime(timestamp?: number) {
    return (timestamp ?? Date.now()) - (this.refTimestamp ?? 0);
  }

  /**
   * Inject a new value to the metric.
   * @param value
   * @param timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   */
  inject(value: number, timestamp?: number) {
    if (Number.isFinite(value) && this.refTimestamp !== undefined) {
      const currentTimestamp = this.getReferenceTime(timestamp);

      for (let item of Metric.ALL_METRICS) {
        if (item.mode === 'start') {
          const metric = this.metrics[item.id];

          if (item.start <= currentTimestamp && item.end >= currentTimestamp) {
            metric.raw.push({ timestamp: currentTimestamp, value: value });
            metric.firstValueTime = metric.firstValueTime === undefined ? currentTimestamp : metric.firstValueTime;
            metric.lastValueTime = currentTimestamp;
            metric.sum += value;
            metric.count += 1;
          } else if (item.start <= currentTimestamp && !metric.ended) {
            metric.ended = true;
            this.dispatch(`${item.id}-end`);
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
   * @param key
   * @param timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   * @return {number}
   */
  getMetric(key: typeof Metric.ALL_METRICS[number], timestamp?: number) {
    if (key && key.id && this.hasReferenceTime()) {
      const metric = this.metrics[key.id];
      if (!metric || !metric.lastValueTime || !metric.firstValueTime) {
        return;
      }

      if (metric.lastValueTime - metric.firstValueTime >= key.requiredWindow) {
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
  }
}
