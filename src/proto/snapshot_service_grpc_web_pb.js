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

var snapshot_pb = require('./snapshot_pb.js')
const proto = {};
proto.android = {};
proto.android.emulation = {};
proto.android.emulation.control = require('./snapshot_service_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.android.emulation.control.SnapshotServiceClient =
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
proto.android.emulation.control.SnapshotServicePromiseClient =
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
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.SnapshotList>}
 */
const methodDescriptor_SnapshotService_ListSnapshots = new grpc.web.MethodDescriptor(
  '/android.emulation.control.SnapshotService/ListSnapshots',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.SnapshotList,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotList.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.SnapshotList>}
 */
const methodInfo_SnapshotService_ListSnapshots = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SnapshotList,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotList.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.SnapshotList)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SnapshotList>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServiceClient.prototype.listSnapshots =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/ListSnapshots',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_ListSnapshots,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.SnapshotList>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.SnapshotServicePromiseClient.prototype.listSnapshots =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/ListSnapshots',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_ListSnapshots);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodDescriptor_SnapshotService_PullSnapshot = new grpc.web.MethodDescriptor(
  '/android.emulation.control.SnapshotService/PullSnapshot',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.SnapshotPackage,
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodInfo_SnapshotService_PullSnapshot = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SnapshotPackage>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServiceClient.prototype.pullSnapshot =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.SnapshotService/PullSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_PullSnapshot);
};


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SnapshotPackage>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServicePromiseClient.prototype.pullSnapshot =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.SnapshotService/PullSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_PullSnapshot);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodDescriptor_SnapshotService_LoadSnapshot = new grpc.web.MethodDescriptor(
  '/android.emulation.control.SnapshotService/LoadSnapshot',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.SnapshotPackage,
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodInfo_SnapshotService_LoadSnapshot = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.SnapshotPackage)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SnapshotPackage>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServiceClient.prototype.loadSnapshot =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/LoadSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_LoadSnapshot,
      callback);
};


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.SnapshotPackage>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.SnapshotServicePromiseClient.prototype.loadSnapshot =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/LoadSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_LoadSnapshot);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodDescriptor_SnapshotService_SaveSnapshot = new grpc.web.MethodDescriptor(
  '/android.emulation.control.SnapshotService/SaveSnapshot',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.SnapshotPackage,
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodInfo_SnapshotService_SaveSnapshot = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.SnapshotPackage)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SnapshotPackage>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServiceClient.prototype.saveSnapshot =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/SaveSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_SaveSnapshot,
      callback);
};


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.SnapshotPackage>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.SnapshotServicePromiseClient.prototype.saveSnapshot =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/SaveSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_SaveSnapshot);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodDescriptor_SnapshotService_DeleteSnapshot = new grpc.web.MethodDescriptor(
  '/android.emulation.control.SnapshotService/DeleteSnapshot',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.SnapshotPackage,
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.SnapshotPackage,
 *   !proto.android.emulation.control.SnapshotPackage>}
 */
const methodInfo_SnapshotService_DeleteSnapshot = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.SnapshotPackage,
  /**
   * @param {!proto.android.emulation.control.SnapshotPackage} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.SnapshotPackage.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.SnapshotPackage)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.SnapshotPackage>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServiceClient.prototype.deleteSnapshot =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/DeleteSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_DeleteSnapshot,
      callback);
};


/**
 * @param {!proto.android.emulation.control.SnapshotPackage} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.SnapshotPackage>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.SnapshotServicePromiseClient.prototype.deleteSnapshot =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/DeleteSnapshot',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_DeleteSnapshot);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.IceboxTarget,
 *   !proto.android.emulation.control.IceboxTarget>}
 */
const methodDescriptor_SnapshotService_TrackProcess = new grpc.web.MethodDescriptor(
  '/android.emulation.control.SnapshotService/TrackProcess',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.IceboxTarget,
  proto.android.emulation.control.IceboxTarget,
  /**
   * @param {!proto.android.emulation.control.IceboxTarget} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.IceboxTarget.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.IceboxTarget,
 *   !proto.android.emulation.control.IceboxTarget>}
 */
const methodInfo_SnapshotService_TrackProcess = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.IceboxTarget,
  /**
   * @param {!proto.android.emulation.control.IceboxTarget} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.IceboxTarget.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.IceboxTarget} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.IceboxTarget)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.IceboxTarget>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.SnapshotServiceClient.prototype.trackProcess =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/TrackProcess',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_TrackProcess,
      callback);
};


/**
 * @param {!proto.android.emulation.control.IceboxTarget} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.IceboxTarget>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.SnapshotServicePromiseClient.prototype.trackProcess =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.SnapshotService/TrackProcess',
      request,
      metadata || {},
      methodDescriptor_SnapshotService_TrackProcess);
};


module.exports = proto.android.emulation.control;

