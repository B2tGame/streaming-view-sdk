import * as jspb from 'google-protobuf';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

export class RtcId extends jspb.Message {
  getGuid(): string;
  setGuid(value: string): RtcId;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RtcId.AsObject;
  static toObject(includeInstance: boolean, msg: RtcId): RtcId.AsObject;
  static serializeBinaryToWriter(message: RtcId, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RtcId;
  static deserializeBinaryFromReader(message: RtcId, reader: jspb.BinaryReader): RtcId;
}

export namespace RtcId {
  export type AsObject = {
    guid: string;
  };
}

export class JsepMsg extends jspb.Message {
  getId(): RtcId | undefined;
  setId(value?: RtcId): JsepMsg;
  hasId(): boolean;
  clearId(): JsepMsg;

  getMessage(): string;
  setMessage(value: string): JsepMsg;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JsepMsg.AsObject;
  static toObject(includeInstance: boolean, msg: JsepMsg): JsepMsg.AsObject;
  static serializeBinaryToWriter(message: JsepMsg, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JsepMsg;
  static deserializeBinaryFromReader(message: JsepMsg, reader: jspb.BinaryReader): JsepMsg;
}

export namespace JsepMsg {
  export type AsObject = {
    id?: RtcId.AsObject;
    message: string;
  };
}
