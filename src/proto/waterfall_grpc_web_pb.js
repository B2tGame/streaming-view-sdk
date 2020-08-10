/**
 * @fileoverview gRPC-Web generated client stub for waterfall
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
proto.waterfall = require('./waterfall_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.waterfall.WaterfallClient =
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
proto.waterfall.WaterfallPromiseClient =
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
 *   !proto.waterfall.Transfer,
 *   !proto.waterfall.Transfer>}
 */
const methodDescriptor_Waterfall_Pull = new grpc.web.MethodDescriptor(
  '/waterfall.Waterfall/Pull',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.waterfall.Transfer,
  proto.waterfall.Transfer,
  /**
   * @param {!proto.waterfall.Transfer} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.waterfall.Transfer.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.waterfall.Transfer,
 *   !proto.waterfall.Transfer>}
 */
const methodInfo_Waterfall_Pull = new grpc.web.AbstractClientBase.MethodInfo(
  proto.waterfall.Transfer,
  /**
   * @param {!proto.waterfall.Transfer} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.waterfall.Transfer.deserializeBinary
);


/**
 * @param {!proto.waterfall.Transfer} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.waterfall.Transfer>}
 *     The XHR Node Readable Stream
 */
proto.waterfall.WaterfallClient.prototype.pull =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/waterfall.Waterfall/Pull',
      request,
      metadata || {},
      methodDescriptor_Waterfall_Pull);
};


/**
 * @param {!proto.waterfall.Transfer} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.waterfall.Transfer>}
 *     The XHR Node Readable Stream
 */
proto.waterfall.WaterfallPromiseClient.prototype.pull =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/waterfall.Waterfall/Pull',
      request,
      metadata || {},
      methodDescriptor_Waterfall_Pull);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.waterfall.VersionMessage>}
 */
const methodDescriptor_Waterfall_Version = new grpc.web.MethodDescriptor(
  '/waterfall.Waterfall/Version',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.waterfall.VersionMessage,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.waterfall.VersionMessage.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.waterfall.VersionMessage>}
 */
const methodInfo_Waterfall_Version = new grpc.web.AbstractClientBase.MethodInfo(
  proto.waterfall.VersionMessage,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.waterfall.VersionMessage.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.waterfall.VersionMessage)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.waterfall.VersionMessage>|undefined}
 *     The XHR Node Readable Stream
 */
proto.waterfall.WaterfallClient.prototype.version =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/waterfall.Waterfall/Version',
      request,
      metadata || {},
      methodDescriptor_Waterfall_Version,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.waterfall.VersionMessage>}
 *     A native promise that resolves to the response
 */
proto.waterfall.WaterfallPromiseClient.prototype.version =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/waterfall.Waterfall/Version',
      request,
      metadata || {},
      methodDescriptor_Waterfall_Version);
};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.waterfall.PortForwarderClient =
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
proto.waterfall.PortForwarderPromiseClient =
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
 *   !proto.waterfall.PortForwardRequest,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_PortForwarder_ForwardPort = new grpc.web.MethodDescriptor(
  '/waterfall.PortForwarder/ForwardPort',
  grpc.web.MethodType.UNARY,
  proto.waterfall.PortForwardRequest,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.waterfall.PortForwardRequest} request
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
 *   !proto.waterfall.PortForwardRequest,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_PortForwarder_ForwardPort = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.waterfall.PortForwardRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.waterfall.PortForwardRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.waterfall.PortForwarderClient.prototype.forwardPort =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/waterfall.PortForwarder/ForwardPort',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_ForwardPort,
      callback);
};


/**
 * @param {!proto.waterfall.PortForwardRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.waterfall.PortForwarderPromiseClient.prototype.forwardPort =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/waterfall.PortForwarder/ForwardPort',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_ForwardPort);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.waterfall.PortForwardRequest,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_PortForwarder_Stop = new grpc.web.MethodDescriptor(
  '/waterfall.PortForwarder/Stop',
  grpc.web.MethodType.UNARY,
  proto.waterfall.PortForwardRequest,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.waterfall.PortForwardRequest} request
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
 *   !proto.waterfall.PortForwardRequest,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_PortForwarder_Stop = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.waterfall.PortForwardRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.waterfall.PortForwardRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.waterfall.PortForwarderClient.prototype.stop =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/waterfall.PortForwarder/Stop',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_Stop,
      callback);
};


/**
 * @param {!proto.waterfall.PortForwardRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.waterfall.PortForwarderPromiseClient.prototype.stop =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/waterfall.PortForwarder/Stop',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_Stop);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_PortForwarder_StopAll = new grpc.web.MethodDescriptor(
  '/waterfall.PortForwarder/StopAll',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.google.protobuf.Empty} request
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
 *   !proto.google.protobuf.Empty,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_PortForwarder_StopAll = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.waterfall.PortForwarderClient.prototype.stopAll =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/waterfall.PortForwarder/StopAll',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_StopAll,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.waterfall.PortForwarderPromiseClient.prototype.stopAll =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/waterfall.PortForwarder/StopAll',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_StopAll);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.waterfall.ForwardedSessions>}
 */
const methodDescriptor_PortForwarder_List = new grpc.web.MethodDescriptor(
  '/waterfall.PortForwarder/List',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.waterfall.ForwardedSessions,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.waterfall.ForwardedSessions.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.waterfall.ForwardedSessions>}
 */
const methodInfo_PortForwarder_List = new grpc.web.AbstractClientBase.MethodInfo(
  proto.waterfall.ForwardedSessions,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.waterfall.ForwardedSessions.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.waterfall.ForwardedSessions)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.waterfall.ForwardedSessions>|undefined}
 *     The XHR Node Readable Stream
 */
proto.waterfall.PortForwarderClient.prototype.list =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/waterfall.PortForwarder/List',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_List,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.waterfall.ForwardedSessions>}
 *     A native promise that resolves to the response
 */
proto.waterfall.PortForwarderPromiseClient.prototype.list =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/waterfall.PortForwarder/List',
      request,
      metadata || {},
      methodDescriptor_PortForwarder_List);
};


module.exports = proto.waterfall;

