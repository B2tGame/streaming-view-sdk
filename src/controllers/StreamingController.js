import axios from 'axios';
import StreamingEvent from './StreamingEvent';
import buildInfo from './build-info.json';

/**
 * Repeat an httpRequest function until
 *  - It succeeds
 *  - It fails with 404
 *  - It times out
 * @param {number} timeout
 * @param {function: Promise<*>} httpRequest
 */
const retryWithTimeout = (timeout, httpRequest) => {
  let timeoutElapsed = false;
  setTimeout(() => (timeoutElapsed = true), timeout);

  const repeat = (resolve, reject) => {
    // resolve on success
    httpRequest().then(resolve, (err) => {
      // resolve on 404
      if (err.response?.status === 404) {
        return resolve(err.response?.data || {});
      }

      // reject if timed out
      if (timeoutElapsed) {
        return reject(err);
      }

      // retry on error
      return setTimeout(() => repeat(resolve, reject), 10);
    });
  };

  return new Promise(repeat);
};

/**
 * StreamingController is responsible to poll and terminate the edge node.
 *
 * @class StreamingController
 */
class StreamingController {
  static get DEFAULT_TIMEOUT() {
    return 30 * 60 * 1000; // 30 minute
  }

  /**
   * Get SDK Version
   * @returns {string}
   */
  static get SDK_VERSION() {
    return buildInfo.tag;
  }

  /**
   *
   * @param {object} props
   * @param {string} props.apiEndpoint
   * @param {string} props.edgeNodeId Optional parameters, require for some of the API.
   * @param {string} props.internalSession Optional parameter for flagging if the session is internal.
   */
  constructor(props) {
    if (!props.apiEndpoint) {
      throw new Error('StreamingController: Missing apiEndpoint');
    }

    try {
      new URL(props.apiEndpoint);
    } catch (err) {
      throw new Error(`StreamingController: invalid apiEndpoint, got "${props.apiEndpoint}" as input`);
    }

    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId || undefined;
    this.internalSession = props.internalSession || false;
  }

  /**
   * Get the edge node id.
   * @returns {Promise<string>} Resolve Edge Node ID or reject with an error if no edge node ID was provided.
   */
  getEdgeNodeId() {
    return this.edgeNodeId !== undefined
      ? Promise.resolve(this.edgeNodeId)
      : Promise.reject(new Error('StreamingController: Missing edgeNodeId, API endpoint unsupported without Edge Node ID.'));
  }

  /**
   * Terminate the instance (optionally provide a reason for logging purposes)
   * Uses the legacy GET endpoint if no reason is provided
   * @param {string} reason
   * @returns {Promise<*>}
   */
  terminate(reason) {
    if (!reason) return this.getStreamEndpoint().then((streamEndpoint) => axios.get(`${streamEndpoint}/emulator-commands/terminate`));

    const body = {
      reason,
    };
    return this.getStreamEndpoint().then((streamEndpoint) => axios.post(`${streamEndpoint}/emulator-commands/terminate`, body));
  }

  /**
   * Soft Terminate the instance (pause and send the soft-terminate event)
   * @returns {Promise<*>}
   */

  softTerminate() {
    return this.getStreamEndpoint().then((streamEndpoint) => axios.get(`${streamEndpoint}/emulator-commands/soft-terminate`));
  }

  /**
   * Backup the current state
   * @returns {Promise<*>}
   */
  backup() {
    return this.getStreamEndpoint()
      .then((streamEndpoint) => {
        return axios.get(`${streamEndpoint}/emulator-commands/backup`);
      })
      .then((resp) => {
        if (resp.data.toString().startsWith('FAIL')) {
          throw new Error(resp.data.toString());
        } else {
          return resp.data;
        }
      });
  }

  /**
   * Save disk image the current state
   * @returns {Promise<string>}
   */
  diskSnapshot() {
    return this.getStreamEndpoint()
      .then((streamEndpoint) => {
        return axios.get(`${streamEndpoint}/emulator-commands/disk-snapshot`);
      })
      .then((resp) => {
        if (resp.data.toString().startsWith('FAIL')) {
          throw new Error(resp.data.toString());
        } else {
          return resp.data;
        }
      });
  }

  /**
   * Creates a game snapshot
   * @returns {Promise<string>}
   */
  createGameSnapshot() {
    return this.save();
  }

  /**
   * Sends the save command to the supervisor.
   * This is used to trigger different save behaviour depending on edgenode mode.
   * Snapshot mode: saves a snapshot
   * Apk-image mode: saves an apk image
   * Base-image mode: saves a base image definition
   * @returns {Promise<string>}
   */
  save() {
    return this.getStreamEndpoint()
      .then((streamEndpoint) => {
        return axios.get(`${streamEndpoint}/emulator-commands/save`);
      })
      .then((resp) => {
        if (resp.data.toString().startsWith('FAIL')) {
          throw new Error(resp.data.toString());
        } else {
          return resp.data;
        }
      });
  }

  /**
   * Sends the pause command to the supervisor.
   * This is used to pause the emulator.
   * @returns {Promise<*>}
   */
  pause() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, { name: 'streaming-controller', action: 'pause' });
      return axios.get(`${streamEndpoint}/emulator-commands/pause`);
    });
  }

  /**
   * Resets the current moment.
   * @returns {Promise<*>}
   */
  resetMoment() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, {
        name: 'streaming-controller',
        action: 'resetMoment',
      });
      return axios.get(`${streamEndpoint}/emulator-commands/reset`).then((response) => {
        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_READY);
        return response.data;
      });
    });
  }

  /**
   * Sends the pause command to the supervisor.
   * This is used to resume a paused emulator.
   * @returns {Promise<*>}
   */
  resume() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, { name: 'streaming-controller', action: 'resume' });
      return axios.get(`${streamEndpoint}/emulator-commands/resume`);
    });
  }

  /**
   * Requests a screenshot from the emulator.
   * @returns {Promise<ArrayBuffer>}
   */
  screenshot() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, { name: 'streaming-controller', action: 'screenshot' });
      return axios.get(`${streamEndpoint}/emulator-commands/screenshot`, { responseType: 'arraybuffer' }).then((response) => response.data);
    });
  }

  /**
   * Get the streaming endpoint
   * @return {Promise<string>}
   */
  getStreamEndpoint() {
    return this.waitWhile((data) => data.state === 'pending').then((status) => {
      if (status.endpoint !== undefined) {
        return status.endpoint;
      } else {
        throw new Error("Can't resolve Stream Endpoint, got: " + JSON.stringify(status));
      }
    });
  }

  /**
   * Get API Endpoint
   * @returns {string}
   */
  getApiEndpoint() {
    return this.apiEndpoint;
  }

  /**
   * Determine if the session is internal.
   * @return {boolean}
   */
  isInternalSession() {
    return this.internalSession;
  }

  async getEdgeNodeState() {
    const edgeNodeId = await this.getEdgeNodeId();
    const response = await axios.get(`${this.getApiEndpoint()}/api/streaming-games/status/${edgeNodeId}`);
    return response.data.state;
  }

  /**
   * Wait for the edge node to be ready before the promise will resolve.
   * @param {function} stillWaiting Given the status data, return true if waitWhile should wait longer.
   * @param {number} timeout Max duration the waitFor should wait before reject with an timeout exception.
   * @returns {Promise<{state: string, endpoint: string}>}
   */
  async waitWhile(stillWaiting, timeout = StreamingController.DEFAULT_TIMEOUT) {
    const internalSession = this.isInternalSession() ? '&internal=1' : '';

    const edgeNodeId = await this.getEdgeNodeId();

    let isQueuedEventFire = false;

    return retryWithTimeout(timeout, async () => {
      const { data } = await axios.get(`${this.getApiEndpoint()}/api/streaming-games/status/${edgeNodeId}?wait=1${internalSession}`, {
        timeout: 5000,
      });

      if (data.state === 'terminated') {
        return data;
      }

      if (!stillWaiting(data)) {
        return data;
      }

      if (data.queued && !isQueuedEventFire) {
        isQueuedEventFire = true;
        if (this.edgeNodeId) {
          StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.SERVER_OUT_OF_CAPACITY);
        }
      }

      throw new Error('pending');
    });
  }
}

/**
 * Instantiating the StreamingController
 * @returns {Promise<StreamingController>}
 */

// The only reason we are using a factory that returns a promise rather than exposing directly the class is backwards-compatibility.
const factory = (props) => {
  return Promise.resolve(new StreamingController(props));
};

factory.EVENT_EDGE_NODE_CRASHED = StreamingEvent.EDGE_NODE_CRASHED;
factory.EVENT_EMULATOR_CONFIGURATION = StreamingEvent.EMULATOR_CONFIGURATION;
factory.EVENT_MOMENT_DETECTOR_EVENT = StreamingEvent.MOMENT_DETECTOR_EVENT;
factory.EVENT_REQUIRE_USER_PLAY_INTERACTION = StreamingEvent.REQUIRE_USER_PLAY_INTERACTION;
factory.EVENT_SERVER_OUT_OF_CAPACITY = StreamingEvent.SERVER_OUT_OF_CAPACITY;
factory.EVENT_SOCKET_ERROR = StreamingEvent.SOCKET_ERROR;
factory.EVENT_STREAM_CONNECTED = StreamingEvent.STREAM_CONNECTED;
factory.EVENT_STREAM_PAUSED = StreamingEvent.STREAM_PAUSED;
factory.EVENT_STREAM_READY = StreamingEvent.STREAM_READY;
factory.EVENT_STREAM_RESUMED = StreamingEvent.STREAM_RESUMED;
factory.EVENT_STREAM_TERMINATED = StreamingEvent.STREAM_TERMINATED;
factory.EVENT_STREAM_UNREACHABLE = StreamingEvent.STREAM_UNREACHABLE;
factory.EVENT_STREAM_VIDEO_CAN_PLAY = StreamingEvent.STREAM_VIDEO_CAN_PLAY;

factory.SDK_VERSION = StreamingController.SDK_VERSION;
factory.StreamingController = StreamingController;

export default factory;
