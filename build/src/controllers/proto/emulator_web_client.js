"use strict";

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.RtcService = exports.NopAuthenticator = exports.EmulatorControllerService = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _get2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/get"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _emulator_controller_grpc_web_pb = require("../proto/emulator_controller_grpc_web_pb");

var _rtc_service_grpc_web_pb = require("../proto/rtc_service_grpc_web_pb");

var _grpcWeb = require("grpc-web");

var _events = require("events");

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var NopAuthenticator = /*#__PURE__*/(0, _createClass2.default)(function NopAuthenticator() {
  (0, _classCallCheck2.default)(this, NopAuthenticator);

  this.authHeader = function () {
    return {};
  };

  this.unauthorized = function () {};
});
/**
 * A GrcpWebClientBase that inject authentication headers and intercepts
 * errors. If the errors are 401, the unauthorized method of the authenticator will be invoked.
 *
 * @export
 * @class EmulatorWebClient
 * @extends {GrpcWebClientBase}
 */

exports.NopAuthenticator = NopAuthenticator;

var EmulatorWebClient = /*#__PURE__*/function (_GrpcWebClientBase) {
  (0, _inherits2.default)(EmulatorWebClient, _GrpcWebClientBase);

  var _super = _createSuper(EmulatorWebClient);

  function EmulatorWebClient(options, auth) {
    var _thisSuper, _thisSuper2, _this;

    (0, _classCallCheck2.default)(this, EmulatorWebClient);
    _this = _super.call(this, options);

    _this.on = function (name, fn) {
      _this.events.on(name, fn);
    };

    _this.rpcCall = function (method, request, metadata, methodinfo, callback) {
      var authHeader = _this.auth.authHeader();

      var meta = _objectSpread(_objectSpread({}, metadata), authHeader);

      var self = (0, _assertThisInitialized2.default)(_this);
      return (0, _get2.default)((_thisSuper = (0, _assertThisInitialized2.default)(_this), (0, _getPrototypeOf2.default)(EmulatorWebClient.prototype)), "rpcCall", _thisSuper).call(_thisSuper, method, request, meta, methodinfo, function (err, res) {
        if (err) {
          if (err.code === 401) self.auth.unauthorized();
          if (self.events) self.events.emit('error', err);
        }

        if (callback) callback(err, res);
      });
    };

    _this.serverStreaming = function (method, request, metadata, methodInfo) {
      var authHeader = _this.auth.authHeader();

      var meta = _objectSpread(_objectSpread({}, metadata), authHeader);

      var stream = (0, _get2.default)((_thisSuper2 = (0, _assertThisInitialized2.default)(_this), (0, _getPrototypeOf2.default)(EmulatorWebClient.prototype)), "serverStreaming", _thisSuper2).call(_thisSuper2, method, request, meta, methodInfo);
      var self = (0, _assertThisInitialized2.default)(_this); // Intercept errors.

      stream.on('error', function (e) {
        if (e.code === 401) {
          self.auth.unauthorized();
        }

        self.events.emit('error', e);
      });
      return stream;
    };

    _this.auth = auth;
    _this.events = new _events.EventEmitter();

    _this.events.on('error', function (e) {
      console.log('low level gRPC error: ' + (0, _stringify.default)(e));
    });

    return _this;
  }

  return (0, _createClass2.default)(EmulatorWebClient);
}(_grpcWeb.GrpcWebClientBase);
/**
 * An EmulatorControllerService is an EmulatorControllerClient that inject authentication headers.
 * You can provide your own authenticator service that must implement the following mehtods:
 *
 * - `authHeader()` which must return a set of headers that should be send along with a request.
 * - `unauthorized()` a function that gets called when a 401 was received.
 *
 * You can use this to simplify handling authentication failures.
 *
 * TODO(jansene): Maybe expose error handling? That way it does
 * not have to be repeated at every function call.
 *
 * @export
 * @class EmulatorControllerService
 * @extends {EmulatorControllerClient}
 */


var EmulatorControllerService = /*#__PURE__*/function (_EmulatorControllerCl) {
  (0, _inherits2.default)(EmulatorControllerService, _EmulatorControllerCl);

  var _super2 = _createSuper(EmulatorControllerService);

  /**
   *Creates an instance of EmulatorControllerService.
   * @param {string} uri of the emulator controller endpoint.
   * @param {Authenticator} authenticator used to authenticate with the emulator endpoint.
   * @param onError callback that will be invoked when a low level gRPC error arises.
   * @memberof EmulatorControllerService
   */
  function EmulatorControllerService(uri, authenticator, onError) {
    var _this2;

    (0, _classCallCheck2.default)(this, EmulatorControllerService);
    _this2 = _super2.call(this, uri);
    if (!authenticator) authenticator = new NopAuthenticator();
    _this2.client_ = new EmulatorWebClient({}, authenticator);
    if (onError) _this2.client_.on('error', function (e) {
      onError(e);
    });
    return _this2;
  }

  return (0, _createClass2.default)(EmulatorControllerService);
}(_emulator_controller_grpc_web_pb.EmulatorControllerClient);
/**
 * An RtcService is an RtcClient that inject authentication headers.
 * You can provide your own authenticator service that must implement the following mehtods:
 *
 * - `authHeader()` which must return a set of headers that should be send along with a request.
 * - `unauthorized()` a function that gets called when a 401 was received.
 *
 * You can use this to simplify handling authentication failures.
 *
 * @export
 * @class EmulatorControllerService
 * @extends {RtcClient}
 */


exports.EmulatorControllerService = EmulatorControllerService;

var RtcService = /*#__PURE__*/function (_RtcClient) {
  (0, _inherits2.default)(RtcService, _RtcClient);

  var _super3 = _createSuper(RtcService);

  /**
   *Creates an instance of RtcService.
   * @param {string} uri of the emulator controller endpoint.
   * @param {Authenticator} authenticator used to authenticate with the emulator endpoint.
   * @param onError callback that will be invoked when a low level gRPC error arises.
   * @memberof RtcService
   */
  function RtcService(uri, authenticator, onError) {
    var _this3;

    (0, _classCallCheck2.default)(this, RtcService);
    _this3 = _super3.call(this, uri);
    if (!authenticator) authenticator = new NopAuthenticator();
    _this3.client_ = new EmulatorWebClient({}, authenticator);
    if (onError) _this3.client_.on('error', function (e) {
      onError(e);
    });
    return _this3;
  }

  return (0, _createClass2.default)(RtcService);
}(_rtc_service_grpc_web_pb.RtcClient);

exports.RtcService = RtcService;