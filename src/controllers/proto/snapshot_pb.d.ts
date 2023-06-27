import * as jspb from 'google-protobuf';

export class Image extends jspb.Message {
  getType(): Image.Type;
  setType(value: Image.Type): Image;
  hasType(): boolean;
  clearType(): Image;

  getPath(): string;
  setPath(value: string): Image;
  hasPath(): boolean;
  clearPath(): Image;

  getPresent(): boolean;
  setPresent(value: boolean): Image;
  hasPresent(): boolean;
  clearPresent(): Image;

  getSize(): number;
  setSize(value: number): Image;
  hasSize(): boolean;
  clearSize(): Image;

  getModificationTime(): number;
  setModificationTime(value: number): Image;
  hasModificationTime(): boolean;
  clearModificationTime(): Image;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Image.AsObject;
  static toObject(includeInstance: boolean, msg: Image): Image.AsObject;
  static serializeBinaryToWriter(message: Image, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Image;
  static deserializeBinaryFromReader(message: Image, reader: jspb.BinaryReader): Image;
}

export namespace Image {
  export type AsObject = {
    type?: Image.Type;
    path?: string;
    present?: boolean;
    size?: number;
    modificationTime?: number;
  };

  export enum Type {
    IMAGE_TYPE_UNKNOWN = 0,
    IMAGE_TYPE_KERNEL = 1,
    IMAGE_TYPE_KERNEL_RANCHU = 2,
    IMAGE_TYPE_SYSTEM = 3,
    IMAGE_TYPE_SYSTEM_COPY = 4,
    IMAGE_TYPE_DATA = 5,
    IMAGE_TYPE_DATA_COPY = 6,
    IMAGE_TYPE_RAMDISK = 7,
    IMAGE_TYPE_SDCARD = 8,
    IMAGE_TYPE_CACHE = 9,
    IMAGE_TYPE_VENDOR = 10,
    IMAGE_TYPE_ENCRYPTION_KEY = 11,
  }
}

export class Host extends jspb.Message {
  getGpuDriver(): string;
  setGpuDriver(value: string): Host;
  hasGpuDriver(): boolean;
  clearGpuDriver(): Host;

  getHypervisor(): number;
  setHypervisor(value: number): Host;
  hasHypervisor(): boolean;
  clearHypervisor(): Host;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Host.AsObject;
  static toObject(includeInstance: boolean, msg: Host): Host.AsObject;
  static serializeBinaryToWriter(message: Host, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Host;
  static deserializeBinaryFromReader(message: Host, reader: jspb.BinaryReader): Host;
}

export namespace Host {
  export type AsObject = {
    gpuDriver?: string;
    hypervisor?: number;
  };
}

export class Config extends jspb.Message {
  getEnabledFeaturesList(): Array<number>;
  setEnabledFeaturesList(value: Array<number>): Config;
  clearEnabledFeaturesList(): Config;
  addEnabledFeatures(value: number, index?: number): Config;

  getSelectedRenderer(): number;
  setSelectedRenderer(value: number): Config;
  hasSelectedRenderer(): boolean;
  clearSelectedRenderer(): Config;

  getCpuCoreCount(): number;
  setCpuCoreCount(value: number): Config;
  hasCpuCoreCount(): boolean;
  clearCpuCoreCount(): Config;

  getRamSizeBytes(): number;
  setRamSizeBytes(value: number): Config;
  hasRamSizeBytes(): boolean;
  clearRamSizeBytes(): Config;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Config.AsObject;
  static toObject(includeInstance: boolean, msg: Config): Config.AsObject;
  static serializeBinaryToWriter(message: Config, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Config;
  static deserializeBinaryFromReader(message: Config, reader: jspb.BinaryReader): Config;
}

export namespace Config {
  export type AsObject = {
    enabledFeaturesList: Array<number>;
    selectedRenderer?: number;
    cpuCoreCount?: number;
    ramSizeBytes?: number;
  };
}

export class SaveStats extends jspb.Message {
  getIncremental(): number;
  setIncremental(value: number): SaveStats;
  hasIncremental(): boolean;
  clearIncremental(): SaveStats;

  getDuration(): number;
  setDuration(value: number): SaveStats;
  hasDuration(): boolean;
  clearDuration(): SaveStats;

  getRamChangedBytes(): number;
  setRamChangedBytes(value: number): SaveStats;
  hasRamChangedBytes(): boolean;
  clearRamChangedBytes(): SaveStats;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveStats.AsObject;
  static toObject(includeInstance: boolean, msg: SaveStats): SaveStats.AsObject;
  static serializeBinaryToWriter(message: SaveStats, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveStats;
  static deserializeBinaryFromReader(message: SaveStats, reader: jspb.BinaryReader): SaveStats;
}

export namespace SaveStats {
  export type AsObject = {
    incremental?: number;
    duration?: number;
    ramChangedBytes?: number;
  };
}

export class Snapshot extends jspb.Message {
  getVersion(): number;
  setVersion(value: number): Snapshot;
  hasVersion(): boolean;
  clearVersion(): Snapshot;

  getCreationTime(): number;
  setCreationTime(value: number): Snapshot;
  hasCreationTime(): boolean;
  clearCreationTime(): Snapshot;

  getImagesList(): Array<Image>;
  setImagesList(value: Array<Image>): Snapshot;
  clearImagesList(): Snapshot;
  addImages(value?: Image, index?: number): Image;

  getHost(): Host | undefined;
  setHost(value?: Host): Snapshot;
  hasHost(): boolean;
  clearHost(): Snapshot;

  getConfig(): Config | undefined;
  setConfig(value?: Config): Snapshot;
  hasConfig(): boolean;
  clearConfig(): Snapshot;

  getFailedToLoadReasonCode(): number;
  setFailedToLoadReasonCode(value: number): Snapshot;
  hasFailedToLoadReasonCode(): boolean;
  clearFailedToLoadReasonCode(): Snapshot;

  getGuestDataPartitionMounted(): boolean;
  setGuestDataPartitionMounted(value: boolean): Snapshot;
  hasGuestDataPartitionMounted(): boolean;
  clearGuestDataPartitionMounted(): Snapshot;

  getRotation(): number;
  setRotation(value: number): Snapshot;
  hasRotation(): boolean;
  clearRotation(): Snapshot;

  getInvalidLoads(): number;
  setInvalidLoads(value: number): Snapshot;
  hasInvalidLoads(): boolean;
  clearInvalidLoads(): Snapshot;

  getSuccessfulLoads(): number;
  setSuccessfulLoads(value: number): Snapshot;
  hasSuccessfulLoads(): boolean;
  clearSuccessfulLoads(): Snapshot;

  getLogicalName(): string;
  setLogicalName(value: string): Snapshot;
  hasLogicalName(): boolean;
  clearLogicalName(): Snapshot;

  getParent(): string;
  setParent(value: string): Snapshot;
  hasParent(): boolean;
  clearParent(): Snapshot;

  getDescription(): string;
  setDescription(value: string): Snapshot;
  hasDescription(): boolean;
  clearDescription(): Snapshot;

  getSaveStatsList(): Array<SaveStats>;
  setSaveStatsList(value: Array<SaveStats>): Snapshot;
  clearSaveStatsList(): Snapshot;
  addSaveStats(value?: SaveStats, index?: number): SaveStats;

  getFolded(): boolean;
  setFolded(value: boolean): Snapshot;
  hasFolded(): boolean;
  clearFolded(): Snapshot;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Snapshot.AsObject;
  static toObject(includeInstance: boolean, msg: Snapshot): Snapshot.AsObject;
  static serializeBinaryToWriter(message: Snapshot, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Snapshot;
  static deserializeBinaryFromReader(message: Snapshot, reader: jspb.BinaryReader): Snapshot;
}

export namespace Snapshot {
  export type AsObject = {
    version?: number;
    creationTime?: number;
    imagesList: Array<Image.AsObject>;
    host?: Host.AsObject;
    config?: Config.AsObject;
    failedToLoadReasonCode?: number;
    guestDataPartitionMounted?: boolean;
    rotation?: number;
    invalidLoads?: number;
    successfulLoads?: number;
    logicalName?: string;
    parent?: string;
    description?: string;
    saveStatsList: Array<SaveStats.AsObject>;
    folded?: boolean;
  };
}
