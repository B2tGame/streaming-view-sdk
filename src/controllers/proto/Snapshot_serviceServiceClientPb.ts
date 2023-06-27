/**
 * @fileoverview gRPC-Web generated client stub for android.emulation.control
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.4.2
// 	protoc              v3.12.4
// source: snapshot_service.proto

/* eslint-disable */
// @ts-nocheck

import * as grpcWeb from 'grpc-web';

import * as snapshot_service_pb from './snapshot_service_pb'; // proto import: "snapshot_service.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"

export class SnapshotServiceClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string };
  options_: null | { [index: string]: any };

  constructor(hostname: string, credentials?: null | { [index: string]: string }, options?: null | { [index: string]: any }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodDescriptorListSnapshots = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.SnapshotService/ListSnapshots',
    grpcWeb.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    snapshot_service_pb.SnapshotList,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    snapshot_service_pb.SnapshotList.deserializeBinary
  );

  listSnapshots(request: google_protobuf_empty_pb.Empty, metadata: grpcWeb.Metadata | null): Promise<snapshot_service_pb.SnapshotList>;

  listSnapshots(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotList) => void
  ): grpcWeb.ClientReadableStream<snapshot_service_pb.SnapshotList>;

  listSnapshots(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotList) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.SnapshotService/ListSnapshots',
        request,
        metadata || {},
        this.methodDescriptorListSnapshots,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.SnapshotService/ListSnapshots',
      request,
      metadata || {},
      this.methodDescriptorListSnapshots
    );
  }

  methodDescriptorPullSnapshot = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.SnapshotService/PullSnapshot',
    grpcWeb.MethodType.SERVER_STREAMING,
    snapshot_service_pb.SnapshotPackage,
    snapshot_service_pb.SnapshotPackage,
    (request: snapshot_service_pb.SnapshotPackage) => {
      return request.serializeBinary();
    },
    snapshot_service_pb.SnapshotPackage.deserializeBinary
  );

  pullSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<snapshot_service_pb.SnapshotPackage> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.SnapshotService/PullSnapshot',
      request,
      metadata || {},
      this.methodDescriptorPullSnapshot
    );
  }

  methodDescriptorLoadSnapshot = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.SnapshotService/LoadSnapshot',
    grpcWeb.MethodType.UNARY,
    snapshot_service_pb.SnapshotPackage,
    snapshot_service_pb.SnapshotPackage,
    (request: snapshot_service_pb.SnapshotPackage) => {
      return request.serializeBinary();
    },
    snapshot_service_pb.SnapshotPackage.deserializeBinary
  );

  loadSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null
  ): Promise<snapshot_service_pb.SnapshotPackage>;

  loadSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotPackage) => void
  ): grpcWeb.ClientReadableStream<snapshot_service_pb.SnapshotPackage>;

  loadSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotPackage) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.SnapshotService/LoadSnapshot',
        request,
        metadata || {},
        this.methodDescriptorLoadSnapshot,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.SnapshotService/LoadSnapshot',
      request,
      metadata || {},
      this.methodDescriptorLoadSnapshot
    );
  }

  methodDescriptorSaveSnapshot = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.SnapshotService/SaveSnapshot',
    grpcWeb.MethodType.UNARY,
    snapshot_service_pb.SnapshotPackage,
    snapshot_service_pb.SnapshotPackage,
    (request: snapshot_service_pb.SnapshotPackage) => {
      return request.serializeBinary();
    },
    snapshot_service_pb.SnapshotPackage.deserializeBinary
  );

  saveSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null
  ): Promise<snapshot_service_pb.SnapshotPackage>;

  saveSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotPackage) => void
  ): grpcWeb.ClientReadableStream<snapshot_service_pb.SnapshotPackage>;

  saveSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotPackage) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.SnapshotService/SaveSnapshot',
        request,
        metadata || {},
        this.methodDescriptorSaveSnapshot,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.SnapshotService/SaveSnapshot',
      request,
      metadata || {},
      this.methodDescriptorSaveSnapshot
    );
  }

  methodDescriptorDeleteSnapshot = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.SnapshotService/DeleteSnapshot',
    grpcWeb.MethodType.UNARY,
    snapshot_service_pb.SnapshotPackage,
    snapshot_service_pb.SnapshotPackage,
    (request: snapshot_service_pb.SnapshotPackage) => {
      return request.serializeBinary();
    },
    snapshot_service_pb.SnapshotPackage.deserializeBinary
  );

  deleteSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null
  ): Promise<snapshot_service_pb.SnapshotPackage>;

  deleteSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotPackage) => void
  ): grpcWeb.ClientReadableStream<snapshot_service_pb.SnapshotPackage>;

  deleteSnapshot(
    request: snapshot_service_pb.SnapshotPackage,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: snapshot_service_pb.SnapshotPackage) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.SnapshotService/DeleteSnapshot',
        request,
        metadata || {},
        this.methodDescriptorDeleteSnapshot,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.SnapshotService/DeleteSnapshot',
      request,
      metadata || {},
      this.methodDescriptorDeleteSnapshot
    );
  }

  methodDescriptorTrackProcess = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.SnapshotService/TrackProcess',
    grpcWeb.MethodType.UNARY,
    snapshot_service_pb.IceboxTarget,
    snapshot_service_pb.IceboxTarget,
    (request: snapshot_service_pb.IceboxTarget) => {
      return request.serializeBinary();
    },
    snapshot_service_pb.IceboxTarget.deserializeBinary
  );

  trackProcess(request: snapshot_service_pb.IceboxTarget, metadata: grpcWeb.Metadata | null): Promise<snapshot_service_pb.IceboxTarget>;

  trackProcess(
    request: snapshot_service_pb.IceboxTarget,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: snapshot_service_pb.IceboxTarget) => void
  ): grpcWeb.ClientReadableStream<snapshot_service_pb.IceboxTarget>;

  trackProcess(
    request: snapshot_service_pb.IceboxTarget,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: snapshot_service_pb.IceboxTarget) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.SnapshotService/TrackProcess',
        request,
        metadata || {},
        this.methodDescriptorTrackProcess,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.SnapshotService/TrackProcess',
      request,
      metadata || {},
      this.methodDescriptorTrackProcess
    );
  }
}
