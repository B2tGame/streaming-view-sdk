import StreamingEvent from '../StreamingEvent';

/**
 * Monitor the internal state of the StreamingView and report a simplify state description.
 */
export default class WatchDog {

  static get LIFECYCLE_STATE_WAITING_FOR_EDGE_NODE_TO_BE_READY() {
    return 'waiting-to-be-ready';
  }

  static get LIFECYCLE_STATE_READY() {
    return 'ready';
  }

  static get LIFECYCLE_STATE_TERMINATED() {
    return 'terminated';
  }


  /**
   *
   * @param {string} edgeNodeId
   */
  constructor(edgeNodeId) {
    // Set default values for internal fields.
    this.edgeNodeId = edgeNodeId;
    this.subscribers = [];
    this.lifecycelState = WatchDog.LIFECYCLE_STATE_WAITING_FOR_EDGE_NODE_TO_BE_READY;
    this.edgeNodeHasCrached = false;
    this.edgeNodeHasTerminated = false;
    this.serverOutOfCapacity = false;
    this.emulatorState = StreamingEvent.STREAM_PAUSED;
    this.capureScreenEvent = undefined;

    // Configure timer that control how often this event will be emitted.
    this.timer = setInterval(() => this.analyzeState(), 1000);

    // Setup subscribers that listen on diffrent types of events cross the system,
    this.subscribeTo(StreamingEvent.EDGE_NODE_READY_TO_ACCEPT_CONNECTION, () => {
      this.lifecycelState = WatchDog.LIFECYCLE_STATE_READY;
    });
    this.subscribeTo(StreamingEvent.SERVER_OUT_OF_CAPACITY, () => {
      this.serverOutOfCapacity = true;
    });
    this.subscribeTo(StreamingEvent.STREAM_UNREACHABLE, () => {
      this.lifecycelState = WatchDog.LIFECYCLE_STATE_TERMINATED;
    });
    this.subscribeTo(StreamingEvent.EDGE_NODE_CRASHED, () => {
      this.edgeNodeHasCrached = true;
    });
    this.subscribeTo(StreamingEvent.STREAM_TERMINATED, () => {
      this.edgeNodeHasTerminated = true;
    });
    this.subscribeTo(StreamingEvent.STREAM_PAUSED, () => {
      this.emulatorState = StreamingEvent.STREAM_PAUSED;
    });
    this.subscribeTo(StreamingEvent.STREAM_RESUMED, () => {
      this.emulatorState = StreamingEvent.STREAM_RESUMED;
    });
    this.subscribeTo(StreamingEvent.EMULATOR_CONFIGURATION, (configuration) => {
      this.emulatorState = configuration.state !== 'paused' ? StreamingEvent.STREAM_RESUMED : StreamingEvent.STREAM_PAUSED;
    });
    this.subscribeTo(StreamingEvent.CAPTURE_SCREEN, (event) => {
      this.capureScreenEvent = event;
    });

  }

  /**
   * Subscribe to an edgeNode event and include logic to unsubscribe.
   * @param {string} event
   * @param {callback} callback
   * @returns {WatchDog}
   */
  subscribeTo(event, callback) {
    this.subscribers.push({ event: event, callback: callback });
    StreamingEvent.edgeNode(this.edgeNodeId).on(event, callback);
    return this;
  }

  /**
   * Try to analyze the current state the StreamingView are in and report a simplified message.
   */
  analyzeState() {
    switch (this.lifecycelState) {
      case WatchDog.LIFECYCLE_STATE_WAITING_FOR_EDGE_NODE_TO_BE_READY: {
        if (this.serverOutOfCapacity) {
          this.report(false, 'Server out of Capacity, waiting for edge node to be Ready');
        } else {
          this.report(false, 'Waiting for Edge Node to be Ready');
        }
        break;
      }
      case WatchDog.LIFECYCLE_STATE_READY: {
        const hasEvent = this.capureScreenEvent !== undefined && Date.now() - this.capureScreenEvent.timestamp < 1000;
        if (hasEvent && !this.capureScreenEvent.isMountedInView) {
          this.report(false, 'Video stream component is not in DOM tree');
        } else if (hasEvent && !this.capureScreenEvent.isVideoStreamReceived) {
          this.report(false, 'Video Track has not been received from WebRTC');
        } else if (hasEvent && !this.capureScreenEvent.isVideoStreamPlaying) {
          this.report(false, 'Video feed is paused');
        } else if (hasEvent && this.capureScreenEvent.isVideoStreamBlack && this.emulatorState === StreamingEvent.STREAM_PAUSED) {
          this.report(false, 'Emulator is paused');
        } else if (hasEvent && this.capureScreenEvent.isVideoStreamBlack && this.emulatorState === StreamingEvent.STREAM_RESUMED) {
          this.report(false, 'Emulator is display a black screen');
        } else if (hasEvent) {
          this.report(true, 'OK');
        } else {
          this.report(false, 'Video stream component not ready');
        }
        break;
      }
      default: {
        if (this.edgeNodeHasCrached) {
          this.report(false, 'Edge node has unexpected crashed');
        } else if (this.edgeNodeHasTerminated) {
          this.report(false, 'Edge node is terminated');
        } else {
          this.report(false, 'Edge node is unreachable');
        }
        break;
      }
    }
  }


  /**
   * Generate a report with a boolean if the stream is working (none black screen) and a short status message.
   * @param {boolean} hasVideo
   * @param {string} statusMessage
   */
  report(hasVideo, statusMessage) {
    const hasEvent = this.capureScreenEvent !== undefined && Date.now() - this.capureScreenEvent.timestamp < 1000;
    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.WATCH_DOG, {
      hasVideo: hasVideo,
      message: statusMessage,
      captureScreen: hasEvent && this.capureScreenEvent.captureScreen ? this.capureScreenEvent.captureScreen() : undefined
    });
  }

  /**
   * Destroy the watch dog and all listeners and timers connected to this functionality.
   */
  destroy() {
    clearInterval(this.timer);
    for (let subscriber of this.subscribers) {
      StreamingEvent.edgeNode(this.edgeNodeId).off(subscriber.event, subscriber.callback);
    }
  }
}
