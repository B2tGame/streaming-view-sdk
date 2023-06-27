/**
 * @fileoverview gRPC-Web generated client stub for android.emulation.control
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.4.2
// 	protoc              v3.12.4
// source: emulator_controller.proto

/* eslint-disable */
// @ts-nocheck

import * as grpcWeb from 'grpc-web';

import * as emulator_controller_pb from './emulator_controller_pb.js'; // proto import: "emulator_controller.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"

export class EmulatorControllerClient {
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

  methodDescriptorstreamSensor = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/streamSensor',
    grpcWeb.MethodType.SERVER_STREAMING,
    emulator_controller_pb.SensorValue,
    emulator_controller_pb.SensorValue,
    (request: emulator_controller_pb.SensorValue) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.SensorValue.deserializeBinary
  );

  streamSensor(
    request: emulator_controller_pb.SensorValue,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.SensorValue> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.EmulatorController/streamSensor',
      request,
      metadata || {},
      this.methodDescriptorstreamSensor
    );
  }

  methodDescriptorgetSensor = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getSensor',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.SensorValue,
    emulator_controller_pb.SensorValue,
    (request: emulator_controller_pb.SensorValue) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.SensorValue.deserializeBinary
  );

  getSensor(request: emulator_controller_pb.SensorValue, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.SensorValue>;

  getSensor(
    request: emulator_controller_pb.SensorValue,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.SensorValue) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.SensorValue>;

  getSensor(
    request: emulator_controller_pb.SensorValue,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.SensorValue) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getSensor',
        request,
        metadata || {},
        this.methodDescriptorgetSensor,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getSensor',
      request,
      metadata || {},
      this.methodDescriptorgetSensor
    );
  }

  methodDescriptorsetSensor = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/setSensor',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.SensorValue,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.SensorValue) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  setSensor(request: emulator_controller_pb.SensorValue, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  setSensor(
    request: emulator_controller_pb.SensorValue,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setSensor(
    request: emulator_controller_pb.SensorValue,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/setSensor',
        request,
        metadata || {},
        this.methodDescriptorsetSensor,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/setSensor',
      request,
      metadata || {},
      this.methodDescriptorsetSensor
    );
  }

  methodDescriptorsetPhysicalModel = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/setPhysicalModel',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.PhysicalModelValue,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.PhysicalModelValue) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  setPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata: grpcWeb.Metadata | null
  ): Promise<google_protobuf_empty_pb.Empty>;

  setPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/setPhysicalModel',
        request,
        metadata || {},
        this.methodDescriptorsetPhysicalModel,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/setPhysicalModel',
      request,
      metadata || {},
      this.methodDescriptorsetPhysicalModel
    );
  }

  methodDescriptorgetPhysicalModel = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getPhysicalModel',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.PhysicalModelValue,
    emulator_controller_pb.PhysicalModelValue,
    (request: emulator_controller_pb.PhysicalModelValue) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.PhysicalModelValue.deserializeBinary
  );

  getPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata: grpcWeb.Metadata | null
  ): Promise<emulator_controller_pb.PhysicalModelValue>;

  getPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.PhysicalModelValue) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.PhysicalModelValue>;

  getPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.PhysicalModelValue) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getPhysicalModel',
        request,
        metadata || {},
        this.methodDescriptorgetPhysicalModel,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getPhysicalModel',
      request,
      metadata || {},
      this.methodDescriptorgetPhysicalModel
    );
  }

  methodDescriptorstreamPhysicalModel = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/streamPhysicalModel',
    grpcWeb.MethodType.SERVER_STREAMING,
    emulator_controller_pb.PhysicalModelValue,
    emulator_controller_pb.PhysicalModelValue,
    (request: emulator_controller_pb.PhysicalModelValue) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.PhysicalModelValue.deserializeBinary
  );

  streamPhysicalModel(
    request: emulator_controller_pb.PhysicalModelValue,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.PhysicalModelValue> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.EmulatorController/streamPhysicalModel',
      request,
      metadata || {},
      this.methodDescriptorstreamPhysicalModel
    );
  }

  methodDescriptorsetClipboard = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/setClipboard',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.ClipData,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.ClipData) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  setClipboard(request: emulator_controller_pb.ClipData, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  setClipboard(
    request: emulator_controller_pb.ClipData,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setClipboard(
    request: emulator_controller_pb.ClipData,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/setClipboard',
        request,
        metadata || {},
        this.methodDescriptorsetClipboard,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/setClipboard',
      request,
      metadata || {},
      this.methodDescriptorsetClipboard
    );
  }

  methodDescriptorgetClipboard = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getClipboard',
    grpcWeb.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    emulator_controller_pb.ClipData,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.ClipData.deserializeBinary
  );

  getClipboard(request: google_protobuf_empty_pb.Empty, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.ClipData>;

  getClipboard(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.ClipData) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.ClipData>;

  getClipboard(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.ClipData) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getClipboard',
        request,
        metadata || {},
        this.methodDescriptorgetClipboard,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getClipboard',
      request,
      metadata || {},
      this.methodDescriptorgetClipboard
    );
  }

  methodDescriptorstreamClipboard = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/streamClipboard',
    grpcWeb.MethodType.SERVER_STREAMING,
    google_protobuf_empty_pb.Empty,
    emulator_controller_pb.ClipData,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.ClipData.deserializeBinary
  );

  streamClipboard(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.ClipData> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.EmulatorController/streamClipboard',
      request,
      metadata || {},
      this.methodDescriptorstreamClipboard
    );
  }

  methodDescriptorsetBattery = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/setBattery',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.BatteryState,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.BatteryState) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  setBattery(request: emulator_controller_pb.BatteryState, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  setBattery(
    request: emulator_controller_pb.BatteryState,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setBattery(
    request: emulator_controller_pb.BatteryState,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/setBattery',
        request,
        metadata || {},
        this.methodDescriptorsetBattery,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/setBattery',
      request,
      metadata || {},
      this.methodDescriptorsetBattery
    );
  }

  methodDescriptorgetBattery = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getBattery',
    grpcWeb.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    emulator_controller_pb.BatteryState,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.BatteryState.deserializeBinary
  );

  getBattery(request: google_protobuf_empty_pb.Empty, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.BatteryState>;

  getBattery(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.BatteryState) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.BatteryState>;

  getBattery(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.BatteryState) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getBattery',
        request,
        metadata || {},
        this.methodDescriptorgetBattery,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getBattery',
      request,
      metadata || {},
      this.methodDescriptorgetBattery
    );
  }

  methodDescriptorsetGps = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/setGps',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.GpsState,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.GpsState) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  setGps(request: emulator_controller_pb.GpsState, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  setGps(
    request: emulator_controller_pb.GpsState,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setGps(
    request: emulator_controller_pb.GpsState,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/setGps',
        request,
        metadata || {},
        this.methodDescriptorsetGps,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/setGps',
      request,
      metadata || {},
      this.methodDescriptorsetGps
    );
  }

  methodDescriptorgetGps = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getGps',
    grpcWeb.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    emulator_controller_pb.GpsState,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.GpsState.deserializeBinary
  );

  getGps(request: google_protobuf_empty_pb.Empty, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.GpsState>;

  getGps(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.GpsState) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.GpsState>;

  getGps(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.GpsState) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getGps',
        request,
        metadata || {},
        this.methodDescriptorgetGps,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getGps',
      request,
      metadata || {},
      this.methodDescriptorgetGps
    );
  }

  methodDescriptorsendFingerprint = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/sendFingerprint',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.Fingerprint,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.Fingerprint) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  sendFingerprint(request: emulator_controller_pb.Fingerprint, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  sendFingerprint(
    request: emulator_controller_pb.Fingerprint,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendFingerprint(
    request: emulator_controller_pb.Fingerprint,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/sendFingerprint',
        request,
        metadata || {},
        this.methodDescriptorsendFingerprint,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/sendFingerprint',
      request,
      metadata || {},
      this.methodDescriptorsendFingerprint
    );
  }

  methodDescriptorsendKey = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/sendKey',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.KeyboardEvent,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.KeyboardEvent) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  sendKey(request: emulator_controller_pb.KeyboardEvent, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  sendKey(
    request: emulator_controller_pb.KeyboardEvent,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendKey(
    request: emulator_controller_pb.KeyboardEvent,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/sendKey',
        request,
        metadata || {},
        this.methodDescriptorsendKey,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/sendKey',
      request,
      metadata || {},
      this.methodDescriptorsendKey
    );
  }

  methodDescriptorsendTouch = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/sendTouch',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.TouchEvent,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.TouchEvent) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  sendTouch(request: emulator_controller_pb.TouchEvent, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  sendTouch(
    request: emulator_controller_pb.TouchEvent,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendTouch(
    request: emulator_controller_pb.TouchEvent,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/sendTouch',
        request,
        metadata || {},
        this.methodDescriptorsendTouch,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/sendTouch',
      request,
      metadata || {},
      this.methodDescriptorsendTouch
    );
  }

  methodDescriptorsendMouse = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/sendMouse',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.MouseEvent,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.MouseEvent) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  sendMouse(request: emulator_controller_pb.MouseEvent, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  sendMouse(
    request: emulator_controller_pb.MouseEvent,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendMouse(
    request: emulator_controller_pb.MouseEvent,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/sendMouse',
        request,
        metadata || {},
        this.methodDescriptorsendMouse,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/sendMouse',
      request,
      metadata || {},
      this.methodDescriptorsendMouse
    );
  }

  methodDescriptorsendPhone = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/sendPhone',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.PhoneCall,
    emulator_controller_pb.PhoneResponse,
    (request: emulator_controller_pb.PhoneCall) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.PhoneResponse.deserializeBinary
  );

  sendPhone(request: emulator_controller_pb.PhoneCall, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.PhoneResponse>;

  sendPhone(
    request: emulator_controller_pb.PhoneCall,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.PhoneResponse) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.PhoneResponse>;

  sendPhone(
    request: emulator_controller_pb.PhoneCall,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.PhoneResponse) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/sendPhone',
        request,
        metadata || {},
        this.methodDescriptorsendPhone,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/sendPhone',
      request,
      metadata || {},
      this.methodDescriptorsendPhone
    );
  }

  methodDescriptorsendSms = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/sendSms',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.SmsMessage,
    emulator_controller_pb.PhoneResponse,
    (request: emulator_controller_pb.SmsMessage) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.PhoneResponse.deserializeBinary
  );

  sendSms(request: emulator_controller_pb.SmsMessage, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.PhoneResponse>;

  sendSms(
    request: emulator_controller_pb.SmsMessage,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.PhoneResponse) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.PhoneResponse>;

  sendSms(
    request: emulator_controller_pb.SmsMessage,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.PhoneResponse) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/sendSms',
        request,
        metadata || {},
        this.methodDescriptorsendSms,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/sendSms',
      request,
      metadata || {},
      this.methodDescriptorsendSms
    );
  }

  methodDescriptorgetStatus = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getStatus',
    grpcWeb.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    emulator_controller_pb.EmulatorStatus,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.EmulatorStatus.deserializeBinary
  );

  getStatus(request: google_protobuf_empty_pb.Empty, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.EmulatorStatus>;

  getStatus(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.EmulatorStatus) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.EmulatorStatus>;

  getStatus(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.EmulatorStatus) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getStatus',
        request,
        metadata || {},
        this.methodDescriptorgetStatus,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getStatus',
      request,
      metadata || {},
      this.methodDescriptorgetStatus
    );
  }

  methodDescriptorgetScreenshot = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getScreenshot',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.ImageFormat,
    emulator_controller_pb.Image,
    (request: emulator_controller_pb.ImageFormat) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.Image.deserializeBinary
  );

  getScreenshot(request: emulator_controller_pb.ImageFormat, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.Image>;

  getScreenshot(
    request: emulator_controller_pb.ImageFormat,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.Image) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.Image>;

  getScreenshot(
    request: emulator_controller_pb.ImageFormat,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.Image) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getScreenshot',
        request,
        metadata || {},
        this.methodDescriptorgetScreenshot,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getScreenshot',
      request,
      metadata || {},
      this.methodDescriptorgetScreenshot
    );
  }

  methodDescriptorstreamScreenshot = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/streamScreenshot',
    grpcWeb.MethodType.SERVER_STREAMING,
    emulator_controller_pb.ImageFormat,
    emulator_controller_pb.Image,
    (request: emulator_controller_pb.ImageFormat) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.Image.deserializeBinary
  );

  streamScreenshot(
    request: emulator_controller_pb.ImageFormat,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.Image> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.EmulatorController/streamScreenshot',
      request,
      metadata || {},
      this.methodDescriptorstreamScreenshot
    );
  }

  methodDescriptorstreamAudio = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/streamAudio',
    grpcWeb.MethodType.SERVER_STREAMING,
    emulator_controller_pb.AudioFormat,
    emulator_controller_pb.AudioPacket,
    (request: emulator_controller_pb.AudioFormat) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.AudioPacket.deserializeBinary
  );

  streamAudio(
    request: emulator_controller_pb.AudioFormat,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.AudioPacket> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.EmulatorController/streamAudio',
      request,
      metadata || {},
      this.methodDescriptorstreamAudio
    );
  }

  methodDescriptorgetLogcat = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getLogcat',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.LogMessage,
    emulator_controller_pb.LogMessage,
    (request: emulator_controller_pb.LogMessage) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.LogMessage.deserializeBinary
  );

  getLogcat(request: emulator_controller_pb.LogMessage, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.LogMessage>;

  getLogcat(
    request: emulator_controller_pb.LogMessage,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.LogMessage) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.LogMessage>;

  getLogcat(
    request: emulator_controller_pb.LogMessage,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.LogMessage) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getLogcat',
        request,
        metadata || {},
        this.methodDescriptorgetLogcat,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getLogcat',
      request,
      metadata || {},
      this.methodDescriptorgetLogcat
    );
  }

  methodDescriptorstreamLogcat = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/streamLogcat',
    grpcWeb.MethodType.SERVER_STREAMING,
    emulator_controller_pb.LogMessage,
    emulator_controller_pb.LogMessage,
    (request: emulator_controller_pb.LogMessage) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.LogMessage.deserializeBinary
  );

  streamLogcat(
    request: emulator_controller_pb.LogMessage,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.LogMessage> {
    return this.client_.serverStreaming(
      this.hostname_ + '/android.emulation.control.EmulatorController/streamLogcat',
      request,
      metadata || {},
      this.methodDescriptorstreamLogcat
    );
  }

  methodDescriptorsetVmState = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/setVmState',
    grpcWeb.MethodType.UNARY,
    emulator_controller_pb.VmRunState,
    google_protobuf_empty_pb.Empty,
    (request: emulator_controller_pb.VmRunState) => {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

  setVmState(request: emulator_controller_pb.VmRunState, metadata: grpcWeb.Metadata | null): Promise<google_protobuf_empty_pb.Empty>;

  setVmState(
    request: emulator_controller_pb.VmRunState,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setVmState(
    request: emulator_controller_pb.VmRunState,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: google_protobuf_empty_pb.Empty) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/setVmState',
        request,
        metadata || {},
        this.methodDescriptorsetVmState,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/setVmState',
      request,
      metadata || {},
      this.methodDescriptorsetVmState
    );
  }

  methodDescriptorgetVmState = new grpcWeb.MethodDescriptor(
    '/android.emulation.control.EmulatorController/getVmState',
    grpcWeb.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    emulator_controller_pb.VmRunState,
    (request: google_protobuf_empty_pb.Empty) => {
      return request.serializeBinary();
    },
    emulator_controller_pb.VmRunState.deserializeBinary
  );

  getVmState(request: google_protobuf_empty_pb.Empty, metadata: grpcWeb.Metadata | null): Promise<emulator_controller_pb.VmRunState>;

  getVmState(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: emulator_controller_pb.VmRunState) => void
  ): grpcWeb.ClientReadableStream<emulator_controller_pb.VmRunState>;

  getVmState(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: emulator_controller_pb.VmRunState) => void
  ) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ + '/android.emulation.control.EmulatorController/getVmState',
        request,
        metadata || {},
        this.methodDescriptorgetVmState,
        callback
      );
    }
    return this.client_.unaryCall(
      this.hostname_ + '/android.emulation.control.EmulatorController/getVmState',
      request,
      metadata || {},
      this.methodDescriptorgetVmState
    );
  }
}
