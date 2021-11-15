"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _empty_pb = require("google-protobuf/google/protobuf/empty_pb");

var _emulator_web_client = require("../../../proto/emulator_web_client");

/**
 * Gets the status of the emulator, parsing the hardware config into something
 * easy to digest.
 *
 * @export
 * @class EmulatorStatus
 */
var EmulatorStatus =
/**
 * Creates an EmulatorStatus object that can retrieve the status of the running emulator.
 *
 * @param {object} uriOrEmulator An emulator controller service, or a URI to a gRPC endpoint.
 * @param {object} auth The authentication service to use, or null for no authentication.
 *
 *  The authentication service should implement the following methods:
 * - `authHeader()` which must return a set of headers that should be send along with a request.
 * - `unauthorized()` a function that gets called when a 401 was received.
 */
function EmulatorStatus(uriOrEmulator, auth) {
  var _this = this;

  (0, _classCallCheck2["default"])(this, EmulatorStatus);

  this.getStatus = function () {
    return _this.status;
  };

  this.updateStatus = function (fnNotify, cache) {
    var request = new _empty_pb.Empty();

    if (cache && _this.status) {
      fnNotify(_this.status);
      return _this.status;
    }

    _this.emulator.getStatus(request, {}, function (err, response) {
      var hwConfig = {}; // Don't get configuration if emulator is unreachable

      if (!response) {
        return;
      }

      var entryList = response.getHardwareconfig().getEntryList();

      for (var i = 0; i < entryList.length; i++) {
        var key = entryList[i].getKey();
        var val = entryList[i].getValue();
        hwConfig[key] = val;
      }

      var vmConfig = response.getVmconfig();
      _this.status = {
        version: response.getVersion(),
        uptime: response.getUptime(),
        booted: response.getBooted(),
        hardwareConfig: hwConfig,
        vmConfig: {
          hypervisorType: vmConfig.getHypervisortype(),
          numberOfCpuCores: vmConfig.getNumberofcpucores(),
          ramSizeBytes: vmConfig.getRamsizebytes()
        }
      };
      fnNotify(_this.status);
    });
  };

  if (uriOrEmulator instanceof _emulator_web_client.EmulatorControllerService) {
    this.emulator = uriOrEmulator;
  } else {
    this.emulator = new _emulator_web_client.EmulatorControllerService(uriOrEmulator, auth);
  }

  this.status = null;
}
/**
 * Gets the cached status.
 *
 * @memberof EmulatorStatus
 */
;

var _default = EmulatorStatus;
exports["default"] = _default;