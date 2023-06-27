import * as jspb from 'google-protobuf';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as snapshot_pb from './snapshot_pb.js';

export class SnapshotPackage extends jspb.Message {
  getSnapshotId(): string;
  setSnapshotId(value: string): SnapshotPackage;

  getPayload(): Uint8Array | string;
  getPayload_asU8(): Uint8Array;
  getPayload_asB64(): string;
  setPayload(value: Uint8Array | string): SnapshotPackage;

  getSuccess(): boolean;
  setSuccess(value: boolean): SnapshotPackage;

  getErr(): Uint8Array | string;
  getErr_asU8(): Uint8Array;
  getErr_asB64(): string;
  setErr(value: Uint8Array | string): SnapshotPackage;

  getFormat(): SnapshotPackage.Format;
  setFormat(value: SnapshotPackage.Format): SnapshotPackage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SnapshotPackage.AsObject;
  static toObject(includeInstance: boolean, msg: SnapshotPackage): SnapshotPackage.AsObject;
  static serializeBinaryToWriter(message: SnapshotPackage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SnapshotPackage;
  static deserializeBinaryFromReader(message: SnapshotPackage, reader: jspb.BinaryReader): SnapshotPackage;
}

export namespace SnapshotPackage {
  export type AsObject = {
    snapshotId: string;
    payload: Uint8Array | string;
    success: boolean;
    err: Uint8Array | string;
    format: SnapshotPackage.Format;
  };

  export enum Format {
    TARGZ = 0,
    TAR = 1,
  }
}

export class SnapshotDetails extends jspb.Message {
  getSnapshotId(): string;
  setSnapshotId(value: string): SnapshotDetails;

  getDetails(): snapshot_pb.Snapshot | undefined;
  setDetails(value?: snapshot_pb.Snapshot): SnapshotDetails;
  hasDetails(): boolean;
  clearDetails(): SnapshotDetails;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SnapshotDetails.AsObject;
  static toObject(includeInstance: boolean, msg: SnapshotDetails): SnapshotDetails.AsObject;
  static serializeBinaryToWriter(message: SnapshotDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SnapshotDetails;
  static deserializeBinaryFromReader(message: SnapshotDetails, reader: jspb.BinaryReader): SnapshotDetails;
}

export namespace SnapshotDetails {
  export type AsObject = {
    snapshotId: string;
    details?: snapshot_pb.Snapshot.AsObject;
  };
}

export class SnapshotList extends jspb.Message {
  getSnapshotsList(): Array<SnapshotDetails>;
  setSnapshotsList(value: Array<SnapshotDetails>): SnapshotList;
  clearSnapshotsList(): SnapshotList;
  addSnapshots(value?: SnapshotDetails, index?: number): SnapshotDetails;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SnapshotList.AsObject;
  static toObject(includeInstance: boolean, msg: SnapshotList): SnapshotList.AsObject;
  static serializeBinaryToWriter(message: SnapshotList, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SnapshotList;
  static deserializeBinaryFromReader(message: SnapshotList, reader: jspb.BinaryReader): SnapshotList;
}

export namespace SnapshotList {
  export type AsObject = {
    snapshotsList: Array<SnapshotDetails.AsObject>;
  };
}

export class IceboxTarget extends jspb.Message {
  getPid(): number;
  setPid(value: number): IceboxTarget;

  getPackageName(): string;
  setPackageName(value: string): IceboxTarget;

  getSnapshotId(): string;
  setSnapshotId(value: string): IceboxTarget;

  getFailed(): boolean;
  setFailed(value: boolean): IceboxTarget;

  getErr(): string;
  setErr(value: string): IceboxTarget;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IceboxTarget.AsObject;
  static toObject(includeInstance: boolean, msg: IceboxTarget): IceboxTarget.AsObject;
  static serializeBinaryToWriter(message: IceboxTarget, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IceboxTarget;
  static deserializeBinaryFromReader(message: IceboxTarget, reader: jspb.BinaryReader): IceboxTarget;
}

export namespace IceboxTarget {
  export type AsObject = {
    pid: number;
    packageName: string;
    snapshotId: string;
    failed: boolean;
    err: string;
  };
}
