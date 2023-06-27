import * as jspb from 'google-protobuf';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

export class Message extends jspb.Message {
  getPayload(): Uint8Array | string;
  getPayload_asU8(): Uint8Array;
  getPayload_asB64(): string;
  setPayload(value: Uint8Array | string): Message;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Message.AsObject;
  static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
  static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Message;
  static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
  export type AsObject = {
    payload: Uint8Array | string;
  };
}

export class Transfer extends jspb.Message {
  getPath(): string;
  setPath(value: string): Transfer;

  getPayload(): Uint8Array | string;
  getPayload_asU8(): Uint8Array;
  getPayload_asB64(): string;
  setPayload(value: Uint8Array | string): Transfer;

  getSuccess(): boolean;
  setSuccess(value: boolean): Transfer;

  getErr(): Uint8Array | string;
  getErr_asU8(): Uint8Array;
  getErr_asB64(): string;
  setErr(value: Uint8Array | string): Transfer;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Transfer.AsObject;
  static toObject(includeInstance: boolean, msg: Transfer): Transfer.AsObject;
  static serializeBinaryToWriter(message: Transfer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Transfer;
  static deserializeBinaryFromReader(message: Transfer, reader: jspb.BinaryReader): Transfer;
}

export namespace Transfer {
  export type AsObject = {
    path: string;
    payload: Uint8Array | string;
    success: boolean;
    err: Uint8Array | string;
  };
}

export class Cmd extends jspb.Message {
  getPath(): string;
  setPath(value: string): Cmd;

  getArgsList(): Array<string>;
  setArgsList(value: Array<string>): Cmd;
  clearArgsList(): Cmd;
  addArgs(value: string, index?: number): Cmd;

  getDir(): string;
  setDir(value: string): Cmd;

  getPipein(): boolean;
  setPipein(value: boolean): Cmd;

  getEnvMap(): jspb.Map<string, string>;
  clearEnvMap(): Cmd;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Cmd.AsObject;
  static toObject(includeInstance: boolean, msg: Cmd): Cmd.AsObject;
  static serializeBinaryToWriter(message: Cmd, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Cmd;
  static deserializeBinaryFromReader(message: Cmd, reader: jspb.BinaryReader): Cmd;
}

export namespace Cmd {
  export type AsObject = {
    path: string;
    argsList: Array<string>;
    dir: string;
    pipein: boolean;
    envMap: Array<[string, string]>;
  };
}

export class CmdProgress extends jspb.Message {
  getCmd(): Cmd | undefined;
  setCmd(value?: Cmd): CmdProgress;
  hasCmd(): boolean;
  clearCmd(): CmdProgress;

  getExitCode(): number;
  setExitCode(value: number): CmdProgress;

  getStdout(): Uint8Array | string;
  getStdout_asU8(): Uint8Array;
  getStdout_asB64(): string;
  setStdout(value: Uint8Array | string): CmdProgress;

  getStderr(): Uint8Array | string;
  getStderr_asU8(): Uint8Array;
  getStderr_asB64(): string;
  setStderr(value: Uint8Array | string): CmdProgress;

  getStdin(): Uint8Array | string;
  getStdin_asU8(): Uint8Array;
  getStdin_asB64(): string;
  setStdin(value: Uint8Array | string): CmdProgress;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CmdProgress.AsObject;
  static toObject(includeInstance: boolean, msg: CmdProgress): CmdProgress.AsObject;
  static serializeBinaryToWriter(message: CmdProgress, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CmdProgress;
  static deserializeBinaryFromReader(message: CmdProgress, reader: jspb.BinaryReader): CmdProgress;
}

export namespace CmdProgress {
  export type AsObject = {
    cmd?: Cmd.AsObject;
    exitCode: number;
    stdout: Uint8Array | string;
    stderr: Uint8Array | string;
    stdin: Uint8Array | string;
  };
}

export class ForwardMessage extends jspb.Message {
  getKind(): ForwardMessage.Kind;
  setKind(value: ForwardMessage.Kind): ForwardMessage;

  getOp(): ForwardMessage.Op;
  setOp(value: ForwardMessage.Op): ForwardMessage;

  getAddr(): string;
  setAddr(value: string): ForwardMessage;

  getPayload(): Uint8Array | string;
  getPayload_asU8(): Uint8Array;
  getPayload_asB64(): string;
  setPayload(value: Uint8Array | string): ForwardMessage;

  getRebind(): boolean;
  setRebind(value: boolean): ForwardMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardMessage): ForwardMessage.AsObject;
  static serializeBinaryToWriter(message: ForwardMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardMessage;
  static deserializeBinaryFromReader(message: ForwardMessage, reader: jspb.BinaryReader): ForwardMessage;
}

export namespace ForwardMessage {
  export type AsObject = {
    kind: ForwardMessage.Kind;
    op: ForwardMessage.Op;
    addr: string;
    payload: Uint8Array | string;
    rebind: boolean;
  };

  export enum Kind {
    UNSET = 0,
    TCP = 1,
    UDP = 2,
    UNIX = 3,
  }

  export enum Op {
    OPEN = 0,
    FWD = 1,
    CLOSE = 2,
  }
}

export class VersionMessage extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): VersionMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VersionMessage.AsObject;
  static toObject(includeInstance: boolean, msg: VersionMessage): VersionMessage.AsObject;
  static serializeBinaryToWriter(message: VersionMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VersionMessage;
  static deserializeBinaryFromReader(message: VersionMessage, reader: jspb.BinaryReader): VersionMessage;
}

export namespace VersionMessage {
  export type AsObject = {
    version: string;
  };
}

export class ForwardSession extends jspb.Message {
  getSrc(): string;
  setSrc(value: string): ForwardSession;

  getDst(): string;
  setDst(value: string): ForwardSession;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardSession.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardSession): ForwardSession.AsObject;
  static serializeBinaryToWriter(message: ForwardSession, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardSession;
  static deserializeBinaryFromReader(message: ForwardSession, reader: jspb.BinaryReader): ForwardSession;
}

export namespace ForwardSession {
  export type AsObject = {
    src: string;
    dst: string;
  };
}

export class PortForwardRequest extends jspb.Message {
  getRebind(): boolean;
  setRebind(value: boolean): PortForwardRequest;

  getSession(): ForwardSession | undefined;
  setSession(value?: ForwardSession): PortForwardRequest;
  hasSession(): boolean;
  clearSession(): PortForwardRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PortForwardRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PortForwardRequest): PortForwardRequest.AsObject;
  static serializeBinaryToWriter(message: PortForwardRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PortForwardRequest;
  static deserializeBinaryFromReader(message: PortForwardRequest, reader: jspb.BinaryReader): PortForwardRequest;
}

export namespace PortForwardRequest {
  export type AsObject = {
    rebind: boolean;
    session?: ForwardSession.AsObject;
  };
}

export class ForwardedSessions extends jspb.Message {
  getSessionsList(): Array<ForwardSession>;
  setSessionsList(value: Array<ForwardSession>): ForwardedSessions;
  clearSessionsList(): ForwardedSessions;
  addSessions(value?: ForwardSession, index?: number): ForwardSession;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardedSessions.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardedSessions): ForwardedSessions.AsObject;
  static serializeBinaryToWriter(message: ForwardedSessions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardedSessions;
  static deserializeBinaryFromReader(message: ForwardedSessions, reader: jspb.BinaryReader): ForwardedSessions;
}

export namespace ForwardedSessions {
  export type AsObject = {
    sessionsList: Array<ForwardSession.AsObject>;
  };
}
