import EventEmitter from 'eventemitter3';
import * as StreamingEventNames from './StreamingEventNames';

type EventTypes = StreamingEventNames.StreamingEventTypes & { event: any[] };

/**
 * Extend Event Emitter with an emit that always send the event to 'event' target
 */
class ExtendedEventEmitter extends EventEmitter<EventTypes> {
  edgeNodeId?: string;

  constructor(edgeNodeId?: string) {
    super();
    this.edgeNodeId = edgeNodeId;
  }

  /**
   * Check if a debug method called applandStreamingRawEventCallback exist, if so invoke it with the raw event data.
   * Example implementation in puppeteer test framework.
   * ```
   * await browser.page().exposeFunction('applandStreamingRawEventCallback', (edgeNodeId, event, data) => {
   *   console.log(edgeNodeId, event, data);
   * });
   * ```
   */
  invokeTestFrameworkRawEventCallback<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    ...args: EventEmitter.EventArgs<EventTypes, T>
  ): boolean {
    return !!window.applandStreamingRawEventCallback?.(this.edgeNodeId, event, ...args);
  }

  /**
   * Event an event
   */
  emit<T extends EventEmitter.EventNames<EventTypes>>(event: T, ...args: EventEmitter.EventArgs<EventTypes, T>): boolean {
    this.invokeTestFrameworkRawEventCallback(event, ...args);
    return this._emit(event, ...args);
  }

  /**
   * Private version of the emit, should not be called outside this file
   */
  _emit<T extends EventEmitter.EventNames<EventTypes>>(event: T, ...args: EventEmitter.EventArgs<EventTypes, T>): boolean {
    super.emit('event', event, ...args);
    return super.emit(event, ...args);
  }
}

const globalEventEmitter = new ExtendedEventEmitter();
const edgeNodeEventEmitter: { [edgeNodeId: string]: ExtendedEventEmitter } = {};

// Get EventEmitter for a specific Edge Node Id.
// This will automatically create a new Event emitter if missing.
export function edgeNode(edgeNodeId: string): ExtendedEventEmitter {
  if (edgeNodeEventEmitter[edgeNodeId] === undefined) {
    edgeNodeEventEmitter[edgeNodeId] = new ExtendedEventEmitter(edgeNodeId);
    emit(StreamingEventNames.NEW_EDGE_NODE, edgeNodeId);
  }
  return edgeNodeEventEmitter[edgeNodeId];
}

/**
 * Destroy all the EventEmitter for a specific edge node and force unsubscribe all listeners
 * that are subscribed for edge node events.
 */
export function destroyEdgeNode(edgeNodeId: string) {
  const emitter = edgeNodeEventEmitter[edgeNodeId];
  if (emitter) {
    delete edgeNodeEventEmitter[edgeNodeId];
    emitter.removeAllListeners();
    emit(StreamingEventNames.DESTROY_EDGE_NODE, edgeNodeId);
  }
}

/**
 * Emit an event to the global scope and all edge node scopes.
 */
export function emit(event: typeof StreamingEventNames[keyof typeof StreamingEventNames], data: any) {
  globalEventEmitter.emit(event, data);
  for (let edgeNodeId in edgeNodeEventEmitter) {
    if (edgeNodeEventEmitter[edgeNodeId]) {
      edgeNodeEventEmitter[edgeNodeId]._emit(event, data);
    }
  }
}

export * from './StreamingEventNames';
