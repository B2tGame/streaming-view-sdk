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
proto.android.emulation.control = require('./rtc_service_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.android.emulation.control.RtcClient =
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
proto.android.emulation.control.RtcPromiseClient =
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
 *   !proto.android.emulation.control.RtcId>}
 */
const methodDescriptor_Rtc_requestRtcStream = new grpc.web.MethodDescriptor(
  '/android.emulation.control.Rtc/requestRtcStream',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.android.emulation.control.RtcId,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.RtcId.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.android.emulation.control.RtcId>}
 */
const methodInfo_Rtc_requestRtcStream = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.RtcId,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.RtcId.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.RtcId)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.RtcId>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.RtcClient.prototype.requestRtcStream =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.Rtc/requestRtcStream',
      request,
      metadata || {},
      methodDescriptor_Rtc_requestRtcStream,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.RtcId>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.RtcPromiseClient.prototype.requestRtcStream =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.Rtc/requestRtcStream',
      request,
      metadata || {},
      methodDescriptor_Rtc_requestRtcStream);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.JsepMsg,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Rtc_sendJsepMessage = new grpc.web.MethodDescriptor(
  '/android.emulation.control.Rtc/sendJsepMessage',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.JsepMsg,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.JsepMsg} request
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
 *   !proto.android.emulation.control.JsepMsg,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Rtc_sendJsepMessage = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.android.emulation.control.JsepMsg} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.JsepMsg} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.RtcClient.prototype.sendJsepMessage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.Rtc/sendJsepMessage',
      request,
      metadata || {},
      methodDescriptor_Rtc_sendJsepMessage,
      callback);
};


/**
 * @param {!proto.android.emulation.control.JsepMsg} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.RtcPromiseClient.prototype.sendJsepMessage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.Rtc/sendJsepMessage',
      request,
      metadata || {},
      methodDescriptor_Rtc_sendJsepMessage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.RtcId,
 *   !proto.android.emulation.control.JsepMsg>}
 */
const methodDescriptor_Rtc_receiveJsepMessages = new grpc.web.MethodDescriptor(
  '/android.emulation.control.Rtc/receiveJsepMessages',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.android.emulation.control.RtcId,
  proto.android.emulation.control.JsepMsg,
  /**
   * @param {!proto.android.emulation.control.RtcId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.JsepMsg.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.RtcId,
 *   !proto.android.emulation.control.JsepMsg>}
 */
const methodInfo_Rtc_receiveJsepMessages = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.JsepMsg,
  /**
   * @param {!proto.android.emulation.control.RtcId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.JsepMsg.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.RtcId} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.JsepMsg>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.RtcClient.prototype.receiveJsepMessages =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.Rtc/receiveJsepMessages',
      request,
      metadata || {},
      methodDescriptor_Rtc_receiveJsepMessages);
};


/**
 * @param {!proto.android.emulation.control.RtcId} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.JsepMsg>}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.RtcPromiseClient.prototype.receiveJsepMessages =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/android.emulation.control.Rtc/receiveJsepMessages',
      request,
      metadata || {},
      methodDescriptor_Rtc_receiveJsepMessages);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.android.emulation.control.RtcId,
 *   !proto.android.emulation.control.JsepMsg>}
 */
const methodDescriptor_Rtc_receiveJsepMessage = new grpc.web.MethodDescriptor(
  '/android.emulation.control.Rtc/receiveJsepMessage',
  grpc.web.MethodType.UNARY,
  proto.android.emulation.control.RtcId,
  proto.android.emulation.control.JsepMsg,
  /**
   * @param {!proto.android.emulation.control.RtcId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.JsepMsg.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.android.emulation.control.RtcId,
 *   !proto.android.emulation.control.JsepMsg>}
 */
const methodInfo_Rtc_receiveJsepMessage = new grpc.web.AbstractClientBase.MethodInfo(
  proto.android.emulation.control.JsepMsg,
  /**
   * @param {!proto.android.emulation.control.RtcId} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.android.emulation.control.JsepMsg.deserializeBinary
);


/**
 * @param {!proto.android.emulation.control.RtcId} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.android.emulation.control.JsepMsg)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.android.emulation.control.JsepMsg>|undefined}
 *     The XHR Node Readable Stream
 */
proto.android.emulation.control.RtcClient.prototype.receiveJsepMessage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/android.emulation.control.Rtc/receiveJsepMessage',
      request,
      metadata || {},
      methodDescriptor_Rtc_receiveJsepMessage,
      callback);
};


/**
 * @param {!proto.android.emulation.control.RtcId} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.android.emulation.control.JsepMsg>}
 *     A native promise that resolves to the response
 */
proto.android.emulation.control.RtcPromiseClient.prototype.receiveJsepMessage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/android.emulation.control.Rtc/receiveJsepMessage',
      request,
      metadata || {},
      methodDescriptor_Rtc_receiveJsepMessage);
};


module.exports = proto.android.emulation.control;

