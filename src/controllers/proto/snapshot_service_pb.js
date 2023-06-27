// source: snapshot_service.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
goog.object.extend(proto, google_protobuf_empty_pb);
var snapshot_pb = require('./snapshot_pb.js');
goog.object.extend(proto, snapshot_pb);
goog.exportSymbol('proto.android.emulation.control.IceboxTarget', null, global);
goog.exportSymbol('proto.android.emulation.control.SnapshotDetails', null, global);
goog.exportSymbol('proto.android.emulation.control.SnapshotList', null, global);
goog.exportSymbol('proto.android.emulation.control.SnapshotPackage', null, global);
goog.exportSymbol('proto.android.emulation.control.SnapshotPackage.Format', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.android.emulation.control.SnapshotPackage = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.android.emulation.control.SnapshotPackage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.android.emulation.control.SnapshotPackage.displayName = 'proto.android.emulation.control.SnapshotPackage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.android.emulation.control.SnapshotDetails = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.android.emulation.control.SnapshotDetails, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.android.emulation.control.SnapshotDetails.displayName = 'proto.android.emulation.control.SnapshotDetails';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.android.emulation.control.SnapshotList = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.android.emulation.control.SnapshotList.repeatedFields_, null);
};
goog.inherits(proto.android.emulation.control.SnapshotList, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.android.emulation.control.SnapshotList.displayName = 'proto.android.emulation.control.SnapshotList';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.android.emulation.control.IceboxTarget = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.android.emulation.control.IceboxTarget, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.android.emulation.control.IceboxTarget.displayName = 'proto.android.emulation.control.IceboxTarget';
}

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.android.emulation.control.SnapshotPackage.prototype.toObject = function (opt_includeInstance) {
    return proto.android.emulation.control.SnapshotPackage.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.android.emulation.control.SnapshotPackage} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.android.emulation.control.SnapshotPackage.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        snapshotId: jspb.Message.getFieldWithDefault(msg, 1, ''),
        payload: msg.getPayload_asB64(),
        success: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
        err: msg.getErr_asB64(),
        format: jspb.Message.getFieldWithDefault(msg, 5, 0),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.android.emulation.control.SnapshotPackage}
 */
proto.android.emulation.control.SnapshotPackage.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.android.emulation.control.SnapshotPackage();
  return proto.android.emulation.control.SnapshotPackage.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.android.emulation.control.SnapshotPackage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.android.emulation.control.SnapshotPackage}
 */
proto.android.emulation.control.SnapshotPackage.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {string} */ (reader.readString());
        msg.setSnapshotId(value);
        break;
      case 2:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setPayload(value);
        break;
      case 3:
        var value = /** @type {boolean} */ (reader.readBool());
        msg.setSuccess(value);
        break;
      case 4:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setErr(value);
        break;
      case 5:
        var value = /** @type {!proto.android.emulation.control.SnapshotPackage.Format} */ (reader.readEnum());
        msg.setFormat(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.android.emulation.control.SnapshotPackage.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.android.emulation.control.SnapshotPackage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.android.emulation.control.SnapshotPackage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.android.emulation.control.SnapshotPackage.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getSnapshotId();
  if (f.length > 0) {
    writer.writeString(1, f);
  }
  f = message.getPayload_asU8();
  if (f.length > 0) {
    writer.writeBytes(2, f);
  }
  f = message.getSuccess();
  if (f) {
    writer.writeBool(3, f);
  }
  f = message.getErr_asU8();
  if (f.length > 0) {
    writer.writeBytes(4, f);
  }
  f = message.getFormat();
  if (f !== 0.0) {
    writer.writeEnum(5, f);
  }
};

/**
 * @enum {number}
 */
proto.android.emulation.control.SnapshotPackage.Format = {
  TARGZ: 0,
  TAR: 1,
};

/**
 * optional string snapshot_id = 1;
 * @return {string}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getSnapshotId = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ''));
};

/**
 * @param {string} value
 * @return {!proto.android.emulation.control.SnapshotPackage} returns this
 */
proto.android.emulation.control.SnapshotPackage.prototype.setSnapshotId = function (value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};

/**
 * optional bytes payload = 2;
 * @return {string}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getPayload = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ''));
};

/**
 * optional bytes payload = 2;
 * This is a type-conversion wrapper around `getPayload()`
 * @return {string}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getPayload_asB64 = function () {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getPayload()));
};

/**
 * optional bytes payload = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getPayload()`
 * @return {!Uint8Array}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getPayload_asU8 = function () {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(this.getPayload()));
};

/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.android.emulation.control.SnapshotPackage} returns this
 */
proto.android.emulation.control.SnapshotPackage.prototype.setPayload = function (value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};

/**
 * optional bool success = 3;
 * @return {boolean}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getSuccess = function () {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};

/**
 * @param {boolean} value
 * @return {!proto.android.emulation.control.SnapshotPackage} returns this
 */
proto.android.emulation.control.SnapshotPackage.prototype.setSuccess = function (value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};

/**
 * optional bytes err = 4;
 * @return {string}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getErr = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ''));
};

/**
 * optional bytes err = 4;
 * This is a type-conversion wrapper around `getErr()`
 * @return {string}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getErr_asB64 = function () {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getErr()));
};

/**
 * optional bytes err = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getErr()`
 * @return {!Uint8Array}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getErr_asU8 = function () {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(this.getErr()));
};

/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.android.emulation.control.SnapshotPackage} returns this
 */
proto.android.emulation.control.SnapshotPackage.prototype.setErr = function (value) {
  return jspb.Message.setProto3BytesField(this, 4, value);
};

/**
 * optional Format format = 5;
 * @return {!proto.android.emulation.control.SnapshotPackage.Format}
 */
proto.android.emulation.control.SnapshotPackage.prototype.getFormat = function () {
  return /** @type {!proto.android.emulation.control.SnapshotPackage.Format} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};

/**
 * @param {!proto.android.emulation.control.SnapshotPackage.Format} value
 * @return {!proto.android.emulation.control.SnapshotPackage} returns this
 */
proto.android.emulation.control.SnapshotPackage.prototype.setFormat = function (value) {
  return jspb.Message.setProto3EnumField(this, 5, value);
};

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.android.emulation.control.SnapshotDetails.prototype.toObject = function (opt_includeInstance) {
    return proto.android.emulation.control.SnapshotDetails.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.android.emulation.control.SnapshotDetails} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.android.emulation.control.SnapshotDetails.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        snapshotId: jspb.Message.getFieldWithDefault(msg, 1, ''),
        details: (f = msg.getDetails()) && snapshot_pb.Snapshot.toObject(includeInstance, f),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.android.emulation.control.SnapshotDetails}
 */
proto.android.emulation.control.SnapshotDetails.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.android.emulation.control.SnapshotDetails();
  return proto.android.emulation.control.SnapshotDetails.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.android.emulation.control.SnapshotDetails} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.android.emulation.control.SnapshotDetails}
 */
proto.android.emulation.control.SnapshotDetails.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {string} */ (reader.readString());
        msg.setSnapshotId(value);
        break;
      case 2:
        var value = new snapshot_pb.Snapshot();
        reader.readMessage(value, snapshot_pb.Snapshot.deserializeBinaryFromReader);
        msg.setDetails(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.android.emulation.control.SnapshotDetails.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.android.emulation.control.SnapshotDetails.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.android.emulation.control.SnapshotDetails} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.android.emulation.control.SnapshotDetails.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getSnapshotId();
  if (f.length > 0) {
    writer.writeString(1, f);
  }
  f = message.getDetails();
  if (f != null) {
    writer.writeMessage(2, f, snapshot_pb.Snapshot.serializeBinaryToWriter);
  }
};

/**
 * optional string snapshot_id = 1;
 * @return {string}
 */
proto.android.emulation.control.SnapshotDetails.prototype.getSnapshotId = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ''));
};

/**
 * @param {string} value
 * @return {!proto.android.emulation.control.SnapshotDetails} returns this
 */
proto.android.emulation.control.SnapshotDetails.prototype.setSnapshotId = function (value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};

/**
 * optional emulator_snapshot.Snapshot details = 2;
 * @return {?proto.emulator_snapshot.Snapshot}
 */
proto.android.emulation.control.SnapshotDetails.prototype.getDetails = function () {
  return /** @type{?proto.emulator_snapshot.Snapshot} */ (jspb.Message.getWrapperField(this, snapshot_pb.Snapshot, 2));
};

/**
 * @param {?proto.emulator_snapshot.Snapshot|undefined} value
 * @return {!proto.android.emulation.control.SnapshotDetails} returns this
 */
proto.android.emulation.control.SnapshotDetails.prototype.setDetails = function (value) {
  return jspb.Message.setWrapperField(this, 2, value);
};

/**
 * Clears the message field making it undefined.
 * @return {!proto.android.emulation.control.SnapshotDetails} returns this
 */
proto.android.emulation.control.SnapshotDetails.prototype.clearDetails = function () {
  return this.setDetails(undefined);
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.android.emulation.control.SnapshotDetails.prototype.hasDetails = function () {
  return jspb.Message.getField(this, 2) != null;
};

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.android.emulation.control.SnapshotList.repeatedFields_ = [1];

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.android.emulation.control.SnapshotList.prototype.toObject = function (opt_includeInstance) {
    return proto.android.emulation.control.SnapshotList.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.android.emulation.control.SnapshotList} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.android.emulation.control.SnapshotList.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        snapshotsList: jspb.Message.toObjectList(
          msg.getSnapshotsList(),
          proto.android.emulation.control.SnapshotDetails.toObject,
          includeInstance
        ),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.android.emulation.control.SnapshotList}
 */
proto.android.emulation.control.SnapshotList.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.android.emulation.control.SnapshotList();
  return proto.android.emulation.control.SnapshotList.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.android.emulation.control.SnapshotList} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.android.emulation.control.SnapshotList}
 */
proto.android.emulation.control.SnapshotList.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = new proto.android.emulation.control.SnapshotDetails();
        reader.readMessage(value, proto.android.emulation.control.SnapshotDetails.deserializeBinaryFromReader);
        msg.addSnapshots(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.android.emulation.control.SnapshotList.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.android.emulation.control.SnapshotList.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.android.emulation.control.SnapshotList} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.android.emulation.control.SnapshotList.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getSnapshotsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(1, f, proto.android.emulation.control.SnapshotDetails.serializeBinaryToWriter);
  }
};

/**
 * repeated SnapshotDetails snapshots = 1;
 * @return {!Array<!proto.android.emulation.control.SnapshotDetails>}
 */
proto.android.emulation.control.SnapshotList.prototype.getSnapshotsList = function () {
  return /** @type{!Array<!proto.android.emulation.control.SnapshotDetails>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.android.emulation.control.SnapshotDetails, 1)
  );
};

/**
 * @param {!Array<!proto.android.emulation.control.SnapshotDetails>} value
 * @return {!proto.android.emulation.control.SnapshotList} returns this
 */
proto.android.emulation.control.SnapshotList.prototype.setSnapshotsList = function (value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};

/**
 * @param {!proto.android.emulation.control.SnapshotDetails=} opt_value
 * @param {number=} opt_index
 * @return {!proto.android.emulation.control.SnapshotDetails}
 */
proto.android.emulation.control.SnapshotList.prototype.addSnapshots = function (opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.android.emulation.control.SnapshotDetails, opt_index);
};

/**
 * Clears the list making it empty but non-null.
 * @return {!proto.android.emulation.control.SnapshotList} returns this
 */
proto.android.emulation.control.SnapshotList.prototype.clearSnapshotsList = function () {
  return this.setSnapshotsList([]);
};

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.android.emulation.control.IceboxTarget.prototype.toObject = function (opt_includeInstance) {
    return proto.android.emulation.control.IceboxTarget.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.android.emulation.control.IceboxTarget} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.android.emulation.control.IceboxTarget.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        pid: jspb.Message.getFieldWithDefault(msg, 1, 0),
        packageName: jspb.Message.getFieldWithDefault(msg, 2, ''),
        snapshotId: jspb.Message.getFieldWithDefault(msg, 3, ''),
        failed: jspb.Message.getBooleanFieldWithDefault(msg, 4, false),
        err: jspb.Message.getFieldWithDefault(msg, 5, ''),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.android.emulation.control.IceboxTarget}
 */
proto.android.emulation.control.IceboxTarget.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.android.emulation.control.IceboxTarget();
  return proto.android.emulation.control.IceboxTarget.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.android.emulation.control.IceboxTarget} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.android.emulation.control.IceboxTarget}
 */
proto.android.emulation.control.IceboxTarget.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {number} */ (reader.readInt64());
        msg.setPid(value);
        break;
      case 2:
        var value = /** @type {string} */ (reader.readString());
        msg.setPackageName(value);
        break;
      case 3:
        var value = /** @type {string} */ (reader.readString());
        msg.setSnapshotId(value);
        break;
      case 4:
        var value = /** @type {boolean} */ (reader.readBool());
        msg.setFailed(value);
        break;
      case 5:
        var value = /** @type {string} */ (reader.readString());
        msg.setErr(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.android.emulation.control.IceboxTarget.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.android.emulation.control.IceboxTarget.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.android.emulation.control.IceboxTarget} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.android.emulation.control.IceboxTarget.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getPid();
  if (f !== 0) {
    writer.writeInt64(1, f);
  }
  f = message.getPackageName();
  if (f.length > 0) {
    writer.writeString(2, f);
  }
  f = message.getSnapshotId();
  if (f.length > 0) {
    writer.writeString(3, f);
  }
  f = message.getFailed();
  if (f) {
    writer.writeBool(4, f);
  }
  f = message.getErr();
  if (f.length > 0) {
    writer.writeString(5, f);
  }
};

/**
 * optional int64 pid = 1;
 * @return {number}
 */
proto.android.emulation.control.IceboxTarget.prototype.getPid = function () {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};

/**
 * @param {number} value
 * @return {!proto.android.emulation.control.IceboxTarget} returns this
 */
proto.android.emulation.control.IceboxTarget.prototype.setPid = function (value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};

/**
 * optional string package_name = 2;
 * @return {string}
 */
proto.android.emulation.control.IceboxTarget.prototype.getPackageName = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ''));
};

/**
 * @param {string} value
 * @return {!proto.android.emulation.control.IceboxTarget} returns this
 */
proto.android.emulation.control.IceboxTarget.prototype.setPackageName = function (value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};

/**
 * optional string snapshot_id = 3;
 * @return {string}
 */
proto.android.emulation.control.IceboxTarget.prototype.getSnapshotId = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ''));
};

/**
 * @param {string} value
 * @return {!proto.android.emulation.control.IceboxTarget} returns this
 */
proto.android.emulation.control.IceboxTarget.prototype.setSnapshotId = function (value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};

/**
 * optional bool failed = 4;
 * @return {boolean}
 */
proto.android.emulation.control.IceboxTarget.prototype.getFailed = function () {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};

/**
 * @param {boolean} value
 * @return {!proto.android.emulation.control.IceboxTarget} returns this
 */
proto.android.emulation.control.IceboxTarget.prototype.setFailed = function (value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};

/**
 * optional string err = 5;
 * @return {string}
 */
proto.android.emulation.control.IceboxTarget.prototype.getErr = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ''));
};

/**
 * @param {string} value
 * @return {!proto.android.emulation.control.IceboxTarget} returns this
 */
proto.android.emulation.control.IceboxTarget.prototype.setErr = function (value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};

goog.object.extend(exports, proto.android.emulation.control);
