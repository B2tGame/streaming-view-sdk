"use strict";

var _typeof = require("@babel/runtime-corejs3/helpers/typeof");

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _WeakMap = require("@babel/runtime-corejs3/core-js-stable/weak-map");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var Proto = _interopRequireWildcard(require("../../../proto/emulator_controller_pb"));

var _reactResizeObserver = _interopRequireDefault(require("react-resize-observer"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * A view on the emulator that is generated by streaming a series of screenshots.
 *
 * Note: This is very expensive when running remote, and does not support audio.
 */
var EmulatorPngView = /*#__PURE__*/function (_Component) {
  (0, _inherits2.default)(EmulatorPngView, _Component);

  var _super = _createSuper(EmulatorPngView);

  function EmulatorPngView() {
    var _context;

    var _this;

    (0, _classCallCheck2.default)(this, EmulatorPngView);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, (0, _concat.default)(_context = [this]).call(_context, args));
    _this.state = {
      png: '',
      width: null,
      height: null
    };
    return _this;
  }

  (0, _createClass2.default)(EmulatorPngView, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.startStream();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.screen) {
        this.screen.cancel();
      }
    }
  }, {
    key: "startStream",
    value: function startStream() {
      var _this2 = this;

      var _this$state = this.state,
          width = _this$state.width,
          height = _this$state.height;

      if (this.screen) {
        this.screen.cancel();
      }

      var request = new Proto.ImageFormat();

      if (!isNaN(width)) {
        request.setWidth(Math.floor(width));
        request.setHeight(Math.floor(height));
      }

      var self = this;
      var _this$props = this.props,
          emulator = _this$props.emulator,
          poll = _this$props.poll; // Temporary disabled pool way of `getScreenshot`, since emulator sending corrupted screenshots
      // if (poll) {
      //   this.screen = emulator.getScreenshot(request);
      // } else {
      //   this.screen = emulator.streamScreenshot(request);
      // }

      this.screen = emulator.streamScreenshot(request);
      this.screen.on('data', function (response) {
        // Update the image with the one we just received.
        self.setState({
          png: 'data:image/jpeg;base64,' + response.getImage_asB64()
        });

        if (poll) {
          _this2.startStream(width, height);
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          deviceWidth = _this$props2.deviceWidth,
          deviceHeight = _this$props2.deviceHeight;
      var self = this;
      return /*#__PURE__*/_react.default.createElement("div", {
        style: {
          display: 'block',
          position: 'relative',
          objectFit: 'contain',
          objectPosition: 'center',
          width: deviceWidth,
          height: deviceHeight
        }
      }, /*#__PURE__*/_react.default.createElement(_reactResizeObserver.default, {
        onResize: function onResize(rect) {
          self.setState({
            width: rect.width,
            height: rect.height
          }, self.startStream);
        }
      }), /*#__PURE__*/_react.default.createElement("img", {
        src: this.state.png,
        width: "100%",
        alt: 'png-view'
      }));
    }
  }]);
  return EmulatorPngView;
}(_react.Component);

exports.default = EmulatorPngView;
EmulatorPngView.propTypes = {
  /** Emulator service used to retrieve screenshots. */
  emulator: _propTypes.default.object,

  /** Streaming Edge node ID */
  edgeNodeId: _propTypes.default.string.isRequired,

  /** Event Logger */
  logger: _propTypes.default.object.isRequired,

  /** The width of the component */
  width: _propTypes.default.number,

  /** True if polling should be used, only set this to true if you are using the gowebrpc proxy. */
  poll: _propTypes.default.bool,

  /** The width of the emulator device */
  deviceWidth: _propTypes.default.number,

  /** The height of the emulator device */
  deviceHeight: _propTypes.default.number
};