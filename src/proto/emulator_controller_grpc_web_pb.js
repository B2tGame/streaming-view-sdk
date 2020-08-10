/**
 * @fileoverview gRPC-Web generated client stub for android.emulation.control
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')
const proto = {};
proto.android = {};
proto.android.emulation = {};
proto.android.emulation.control = require('./emulator_controller_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.android.emulation.control.EmulatorControllerClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.android.emulation.control.EmulatorControllerPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SensorValue,
 *   !proto.android.emulation.control.SensorValue>}
 */
const methodDescriptor_EmulatorController_streamSensor = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/streamSensor',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.SensorValue,
  proto.android.emulation.control.SensorValue,
  /**
   * @param {!proto.android.emulation.control.SensorValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SensorValue.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SensorValue,
 *   !proto.android.emulation.control.SensorValue>}
 */
const methodInfo_EmulatorController_streamSensor = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SensorValue,
  /**
   * @param {!proto.android.emulation.control.SensorValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SensorValue.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SensorValue} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SensorValue>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.streamSensor =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamSensor',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamSensor);
};


/**
 * @param {!proto.android.emulation.control.SensorValue} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SensorValue>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.streamSensor =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamSensor',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamSensor);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SensorValue,
 *   !proto.android.emulation.control.SensorValue>}
 */
const methodDescriptor_EmulatorController_getSensor = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getSensor',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.SensorValue,
  proto.android.emulation.control.SensorValue,
  /**
   * @param {!proto.android.emulation.control.SensorValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SensorValue.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SensorValue,
 *   !proto.android.emulation.control.SensorValue>}
 */
const methodInfo_EmulatorController_getSensor = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SensorValue,
  /**
   * @param {!proto.android.emulation.control.SensorValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SensorValue.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SensorValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.SensorValue)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SensorValue>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getSensor =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getSensor',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getSensor,
      callback);
};


/**
 * @param {!proto.android.emulation.control.SensorValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.SensorValue>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getSensor =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getSensor',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getSensor);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SensorValue,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_setSensor = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/setSensor',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.SensorValue,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.SensorValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SensorValue,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_setSensor = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.SensorValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SensorValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.setSensor =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setSensor',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setSensor,
      callback);
};


/**
 * @param {!proto.android.emulation.control.SensorValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.setSensor =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setSensor',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setSensor);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.PhysicalModelValue,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_setPhysicalModel = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/setPhysicalModel',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.PhysicalModelValue,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.PhysicalModelValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.PhysicalModelValue,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_setPhysicalModel = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.PhysicalModelValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.PhysicalModelValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.setPhysicalModel =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setPhysicalModel',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setPhysicalModel,
      callback);
};


/**
 * @param {!proto.android.emulation.control.PhysicalModelValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.setPhysicalModel =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setPhysicalModel',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setPhysicalModel);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.PhysicalModelValue,
 *   !proto.android.emulation.control.PhysicalModelValue>}
 */
const methodDescriptor_EmulatorController_getPhysicalModel = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getPhysicalModel',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.PhysicalModelValue,
  proto.android.emulation.control.PhysicalModelValue,
  /**
   * @param {!proto.android.emulation.control.PhysicalModelValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhysicalModelValue.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.PhysicalModelValue,
 *   !proto.android.emulation.control.PhysicalModelValue>}
 */
const methodInfo_EmulatorController_getPhysicalModel = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.PhysicalModelValue,
  /**
   * @param {!proto.android.emulation.control.PhysicalModelValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhysicalModelValue.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.PhysicalModelValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.PhysicalModelValue)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.PhysicalModelValue>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getPhysicalModel =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getPhysicalModel',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getPhysicalModel,
      callback);
};


/**
 * @param {!proto.android.emulation.control.PhysicalModelValue} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.PhysicalModelValue>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getPhysicalModel =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getPhysicalModel',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getPhysicalModel);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.PhysicalModelValue,
 *   !proto.android.emulation.control.PhysicalModelValue>}
 */
const methodDescriptor_EmulatorController_streamPhysicalModel = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/streamPhysicalModel',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.PhysicalModelValue,
  proto.android.emulation.control.PhysicalModelValue,
  /**
   * @param {!proto.android.emulation.control.PhysicalModelValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhysicalModelValue.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.PhysicalModelValue,
 *   !proto.android.emulation.control.PhysicalModelValue>}
 */
const methodInfo_EmulatorController_streamPhysicalModel = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.PhysicalModelValue,
  /**
   * @param {!proto.android.emulation.control.PhysicalModelValue} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhysicalModelValue.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.PhysicalModelValue} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.PhysicalModelValue>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.streamPhysicalModel =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamPhysicalModel',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamPhysicalModel);
};


/**
 * @param {!proto.android.emulation.control.PhysicalModelValue} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.PhysicalModelValue>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.streamPhysicalModel =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamPhysicalModel',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamPhysicalModel);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.ClipData,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_setClipboard = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/setClipboard',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.ClipData,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.ClipData} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.ClipData,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_setClipboard = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.ClipData} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.ClipData} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.setClipboard =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setClipboard',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setClipboard,
      callback);
};


/**
 * @param {!proto.android.emulation.control.ClipData} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.setClipboard =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setClipboard',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setClipboard);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.ClipData>}
 */
const methodDescriptor_EmulatorController_getClipboard = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getClipboard',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.ClipData,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.ClipData.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.ClipData>}
 */
const methodInfo_EmulatorController_getClipboard = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.ClipData,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.ClipData.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.ClipData)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.ClipData>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getClipboard =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getClipboard',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getClipboard,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.ClipData>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getClipboard =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getClipboard',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getClipboard);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.ClipData>}
 */
const methodDescriptor_EmulatorController_streamClipboard = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/streamClipboard',
  grpc.web.MethodType.SERVER_STREAMING,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.ClipData,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.ClipData.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.ClipData>}
 */
const methodInfo_EmulatorController_streamClipboard = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.ClipData,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.ClipData.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.ClipData>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.streamClipboard =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamClipboard',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamClipboard);
};


/**
 * @param {!proto.google.protobuf.Empty} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.ClipData>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.streamClipboard =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamClipboard',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamClipboard);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.BatteryState,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_setBattery = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/setBattery',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.BatteryState,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.BatteryState} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.BatteryState,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_setBattery = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.BatteryState} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.BatteryState} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.setBattery =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setBattery',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setBattery,
      callback);
};


/**
 * @param {!proto.android.emulation.control.BatteryState} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.setBattery =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setBattery',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setBattery);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.BatteryState>}
 */
const methodDescriptor_EmulatorController_getBattery = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getBattery',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.BatteryState,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.BatteryState.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.BatteryState>}
 */
const methodInfo_EmulatorController_getBattery = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.BatteryState,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.BatteryState.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.BatteryState)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.BatteryState>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getBattery =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getBattery',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getBattery,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.BatteryState>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getBattery =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getBattery',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getBattery);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.GpsState,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_setGps = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/setGps',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.GpsState,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.GpsState} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.GpsState,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_setGps = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.GpsState} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.GpsState} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.setGps =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setGps',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setGps,
      callback);
};


/**
 * @param {!proto.android.emulation.control.GpsState} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.setGps =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setGps',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setGps);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.GpsState>}
 */
const methodDescriptor_EmulatorController_getGps = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getGps',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.GpsState,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.GpsState.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.GpsState>}
 */
const methodInfo_EmulatorController_getGps = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.GpsState,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.GpsState.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.GpsState)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.GpsState>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getGps =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getGps',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getGps,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.GpsState>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getGps =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getGps',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getGps);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.Fingerprint,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_sendFingerprint = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/sendFingerprint',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.Fingerprint,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.Fingerprint} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.Fingerprint,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_sendFingerprint = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.Fingerprint} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.Fingerprint} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.sendFingerprint =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendFingerprint',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendFingerprint,
      callback);
};


/**
 * @param {!proto.android.emulation.control.Fingerprint} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.sendFingerprint =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendFingerprint',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendFingerprint);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.KeyboardEvent,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_sendKey = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/sendKey',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.KeyboardEvent,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.KeyboardEvent} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.KeyboardEvent,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_sendKey = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.KeyboardEvent} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.KeyboardEvent} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.sendKey =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendKey',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendKey,
      callback);
};


/**
 * @param {!proto.android.emulation.control.KeyboardEvent} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.sendKey =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendKey',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendKey);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.TouchEvent,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_sendTouch = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/sendTouch',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.TouchEvent,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.TouchEvent} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.TouchEvent,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_sendTouch = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.TouchEvent} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.TouchEvent} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.sendTouch =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendTouch',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendTouch,
      callback);
};


/**
 * @param {!proto.android.emulation.control.TouchEvent} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.sendTouch =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendTouch',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendTouch);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.MouseEvent,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_sendMouse = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/sendMouse',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.MouseEvent,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.MouseEvent} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.MouseEvent,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_sendMouse = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.MouseEvent} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.MouseEvent} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.sendMouse =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendMouse',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendMouse,
      callback);
};


/**
 * @param {!proto.android.emulation.control.MouseEvent} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.sendMouse =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendMouse',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendMouse);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.PhoneCall,
 *   !proto.android.emulation.control.PhoneResponse>}
 */
const methodDescriptor_EmulatorController_sendPhone = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/sendPhone',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.PhoneCall,
  proto.android.emulation.control.PhoneResponse,
  /**
   * @param {!proto.android.emulation.control.PhoneCall} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhoneResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.PhoneCall,
 *   !proto.android.emulation.control.PhoneResponse>}
 */
const methodInfo_EmulatorController_sendPhone = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.PhoneResponse,
  /**
   * @param {!proto.android.emulation.control.PhoneCall} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhoneResponse.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.PhoneCall} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.PhoneResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.PhoneResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.sendPhone =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendPhone',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendPhone,
      callback);
};


/**
 * @param {!proto.android.emulation.control.PhoneCall} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.PhoneResponse>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.sendPhone =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendPhone',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendPhone);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SmsMessage,
 *   !proto.android.emulation.control.PhoneResponse>}
 */
const methodDescriptor_EmulatorController_sendSms = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/sendSms',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.SmsMessage,
  proto.android.emulation.control.PhoneResponse,
  /**
   * @param {!proto.android.emulation.control.SmsMessage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhoneResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SmsMessage,
 *   !proto.android.emulation.control.PhoneResponse>}
 */
const methodInfo_EmulatorController_sendSms = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.PhoneResponse,
  /**
   * @param {!proto.android.emulation.control.SmsMessage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.PhoneResponse.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SmsMessage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.PhoneResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.PhoneResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.sendSms =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendSms',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendSms,
      callback);
};


/**
 * @param {!proto.android.emulation.control.SmsMessage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.PhoneResponse>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.sendSms =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/sendSms',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_sendSms);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.EmulatorStatus>}
 */
const methodDescriptor_EmulatorController_getStatus = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getStatus',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.EmulatorStatus,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.EmulatorStatus.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.EmulatorStatus>}
 */
const methodInfo_EmulatorController_getStatus = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.EmulatorStatus,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.EmulatorStatus.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.EmulatorStatus)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.EmulatorStatus>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getStatus =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getStatus',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getStatus,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.EmulatorStatus>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getStatus =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getStatus',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getStatus);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.ImageFormat,
 *   !proto.android.emulation.control.Image>}
 */
const methodDescriptor_EmulatorController_getScreenshot = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getScreenshot',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.ImageFormat,
  proto.android.emulation.control.Image,
  /**
   * @param {!proto.android.emulation.control.ImageFormat} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.Image.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.ImageFormat,
 *   !proto.android.emulation.control.Image>}
 */
const methodInfo_EmulatorController_getScreenshot = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.Image,
  /**
   * @param {!proto.android.emulation.control.ImageFormat} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.Image.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.ImageFormat} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.Image)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.Image>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getScreenshot =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getScreenshot',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getScreenshot,
      callback);
};


/**
 * @param {!proto.android.emulation.control.ImageFormat} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.Image>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getScreenshot =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getScreenshot',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getScreenshot);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.ImageFormat,
 *   !proto.android.emulation.control.Image>}
 */
const methodDescriptor_EmulatorController_streamScreenshot = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/streamScreenshot',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.ImageFormat,
  proto.android.emulation.control.Image,
  /**
   * @param {!proto.android.emulation.control.ImageFormat} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.Image.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.ImageFormat,
 *   !proto.android.emulation.control.Image>}
 */
const methodInfo_EmulatorController_streamScreenshot = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.Image,
  /**
   * @param {!proto.android.emulation.control.ImageFormat} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.Image.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.ImageFormat} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.Image>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.streamScreenshot =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamScreenshot',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamScreenshot);
};


/**
 * @param {!proto.android.emulation.control.ImageFormat} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.Image>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.streamScreenshot =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamScreenshot',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamScreenshot);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.AudioFormat,
 *   !proto.android.emulation.control.AudioPacket>}
 */
const methodDescriptor_EmulatorController_streamAudio = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/streamAudio',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.AudioFormat,
  proto.android.emulation.control.AudioPacket,
  /**
   * @param {!proto.android.emulation.control.AudioFormat} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.AudioPacket.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.AudioFormat,
 *   !proto.android.emulation.control.AudioPacket>}
 */
const methodInfo_EmulatorController_streamAudio = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.AudioPacket,
  /**
   * @param {!proto.android.emulation.control.AudioFormat} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.AudioPacket.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.AudioFormat} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.AudioPacket>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.streamAudio =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamAudio',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamAudio);
};


/**
 * @param {!proto.android.emulation.control.AudioFormat} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.AudioPacket>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.streamAudio =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamAudio',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamAudio);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.LogMessage,
 *   !proto.android.emulation.control.LogMessage>}
 */
const methodDescriptor_EmulatorController_getLogcat = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getLogcat',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.LogMessage,
  proto.android.emulation.control.LogMessage,
  /**
   * @param {!proto.android.emulation.control.LogMessage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.LogMessage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.LogMessage,
 *   !proto.android.emulation.control.LogMessage>}
 */
const methodInfo_EmulatorController_getLogcat = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.LogMessage,
  /**
   * @param {!proto.android.emulation.control.LogMessage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.LogMessage.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.LogMessage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.LogMessage)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.LogMessage>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getLogcat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getLogcat',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getLogcat,
      callback);
};


/**
 * @param {!proto.android.emulation.control.LogMessage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.LogMessage>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getLogcat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getLogcat',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getLogcat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.LogMessage,
 *   !proto.android.emulation.control.LogMessage>}
 */
const methodDescriptor_EmulatorController_streamLogcat = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/streamLogcat',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.LogMessage,
  proto.android.emulation.control.LogMessage,
  /**
   * @param {!proto.android.emulation.control.LogMessage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.LogMessage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.LogMessage,
 *   !proto.android.emulation.control.LogMessage>}
 */
const methodInfo_EmulatorController_streamLogcat = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.LogMessage,
  /**
   * @param {!proto.android.emulation.control.LogMessage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.LogMessage.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.LogMessage} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.LogMessage>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.streamLogcat =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamLogcat',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamLogcat);
};


/**
 * @param {!proto.android.emulation.control.LogMessage} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.LogMessage>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.streamLogcat =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.EmulatorController/streamLogcat',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_streamLogcat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.VmRunState,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_EmulatorController_setVmState = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/setVmState',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.VmRunState,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.VmRunState} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.VmRunState,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_EmulatorController_setVmState = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.VmRunState} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.VmRunState} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.setVmState =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setVmState',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setVmState,
      callback);
};


/**
 * @param {!proto.android.emulation.control.VmRunState} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.setVmState =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/setVmState',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_setVmState);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.VmRunState>}
 */
const methodDescriptor_EmulatorController_getVmState = new grpc.web.MethodDescriptor(
  '/android.emulation.control.EmulatorController/getVmState',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.VmRunState,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.VmRunState.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.VmRunState>}
 */
const methodInfo_EmulatorController_getVmState = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.VmRunState,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.VmRunState.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.VmRunState)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.VmRunState>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.EmulatorControllerClient.prototype.getVmState =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getVmState',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getVmState,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.VmRunState>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.EmulatorControllerPromiseClient.prototype.getVmState =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.EmulatorController/getVmState',
      request,
      metadata || {},
      methodDescriptor_EmulatorController_getVmState);
};


module.exports = proto.android.emulation.control;

