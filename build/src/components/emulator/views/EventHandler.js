"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var Proto = _interopRequireWildcard(require("../../../proto/emulator_controller_pb"));

var _EmulatorStatus = _interopRequireDefault(require("../net/EmulatorStatus"));

var _reactDeviceDetect = require("react-device-detect");

var _screenfull = _interopRequireDefault(require("screenfull"));

var _StreamingEvent = _interopRequireDefault(require("../../../StreamingEvent"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const ORIENTATION_PORTRAIT = 'portrait';
const ORIENTATION_LANDSCAPE = 'landscape';
/**
 * A handler that extends a view to send key/mouse events to the emulator.
 * It wraps the inner component in a div, and will use the jsep handler
 * to send key/mouse/touch events over the proper channel.
 *
 * It will translate the mouse events based upon the returned display size of
 * the emulator.
 *
 * You usually want to wrap a EmulatorRtcview, or EmulatorPngView in it.
 */

class EventHandler extends _react.Component {
  /**
   * The minimum amount of time the SDK should wait before sending next USER_INTERACTION event
   * @return {number}
   */
  static get USER_INTERACTION_HOLD_OFF_TIMEOUT() {
    return 500;
  }

  constructor(props) {
    super(props);

    this.touchHandler = function (type, allEvents, events, firstChangedEvent) {
      return this.sendMouse(firstChangedEvent, 0);
    };

    this.handleResize = () => {
      setTimeout(() => {
        this.forceRender();
      }, 50);
    };

    this.forceRender = () => {
      this.setState(this.state);
    };

    this.preventDefault = event => {
      event.preventDefault();
    };

    this.handleUserInteraction = () => {
      if ((this.userInteractionHoldOff || 0) < Date.now()) {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.USER_INTERACTION);

        this.userInteractionHoldOff = Date.now() + EventHandler.USER_INTERACTION_HOLD_OFF_TIMEOUT;
      }

      this.enterFullScreen();
    };

    this.onContextMenu = e => {
      e.preventDefault();
    };

    this.calculateMouseEmulatorCoordinates = event => {
      return this.calculateEmulatorCoordinates(event.offsetX, event.offsetY, event.target.clientWidth, event.target.clientHeight);
    };

    this.calculateTouchEmulatorCoordinates = event => {
      const elementOffset = event.target.getBoundingClientRect();
      return this.calculateEmulatorCoordinates(event.clientX - elementOffset.x, event.clientY - elementOffset.y, event.target.clientWidth, event.target.clientHeight);
    };

    this.sendMouse = (emulatorCords, mouseButton) => {
      const request = new Proto.MouseEvent();
      request.setX(emulatorCords.x);
      request.setY(emulatorCords.y);
      request.setButtons(mouseButton === 0 ? 1 : 0);
      this.sendInput('mouse', request);
    };

    this.sendMultiTouch = (type, allTouchesObject, changedTouchesObject) => {
      const touches = [];
      const allTouches = Object.values(allTouchesObject);
      const changedTouches = Object.values(changedTouchesObject);

      if (type === 'touchstart' || type === 'touchmove') {
        // Add the current set of changed touches (new started/moved touches)
        touches.push(...changedTouches.map(touch => {
          touch.hasForce = 1;
          return touch;
        }));
      } // Collect all removed touches that are no longer in touchHistory set


      const missingTouches = this.touchHistory.filter(touch => allTouches.findIndex(t => t.identifier === touch.identifier) === -1);
      touches.push(...missingTouches.map(touch => {
        touch.hasForce = 0;
        return touch;
      })); // Prepare all touch identifiers for existing touch identifiers and add new available touch identifiers (0..9)

      const touchIdentifiers = [...allTouches, ...missingTouches].reduce((touchIdentifiers, touch) => {
        if (this.touchIdentifiersHistory[touch.identifier] !== undefined) {
          touchIdentifiers[touch.identifier] = this.touchIdentifiersHistory[touch.identifier];
        } else {
          const alreadyUsedIdentifiers = Object.values(touchIdentifiers);
          const nextFreeIdentifier = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(identifier => !(alreadyUsedIdentifiers.indexOf(identifier) !== -1));

          if (nextFreeIdentifier !== undefined) {
            touchIdentifiers[touch.identifier] = nextFreeIdentifier;
          }
        }

        return touchIdentifiers;
      }, {});
      const touchesToSend = [...touches, ...missingTouches].map(touch => {
        const emulatorCords = this.calculateTouchEmulatorCoordinates(touch);
        const identifier = touchIdentifiers[touch.identifier];
        const protoTouch = new Proto.Touch();
        protoTouch.setX(emulatorCords.x);
        protoTouch.setY(emulatorCords.y);
        protoTouch.setIdentifier(identifier);
        protoTouch.setPressure(touch.hasForce);
        return protoTouch;
      }); // Make the grpc call.

      const requestTouchEvent = new Proto.TouchEvent();
      requestTouchEvent.setTouchesList(touchesToSend);
      this.sendInput('touch', requestTouchEvent);
      this.touchHistory = allTouches;
      this.touchIdentifiersHistory = touchIdentifiers;
    };

    this.sendInput = (label, request) => {
      this.handleUserInteraction();

      if (this.props.enableControl) {
        this.props.jsep.send(label, request);
      }
    };

    this.handleTouchStart = event => {
      if (event.cancelable) {
        event.preventDefault();
      }

      this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.touches[0]);

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.TOUCH_START, this.calculateTouchEmulatorCoordinates(event.nativeEvent.touches[0]));
    };

    this.handleTouchEnd = event => {
      if (event.cancelable) {
        event.preventDefault();
      }

      this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.changedTouches[0]);

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.TOUCH_END, this.calculateTouchEmulatorCoordinates(event.nativeEvent));
    };

    this.handleTouchMove = event => {
      if (event.cancelable) {
        event.preventDefault();
      }

      this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.touches[0]);
    };

    this.handleMouseDown = event => {
      if (!_reactDeviceDetect.isMobile) {
        this.mouseDown = true;
        this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);

        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.TOUCH_START, this.calculateTouchEmulatorCoordinates(event.nativeEvent));
      }
    };

    this.handleMouseUp = event => {
      // Don't release mouse when not pressed
      if (!_reactDeviceDetect.isMobile && this.mouseDown) {
        this.mouseDown = false;
        this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent));

        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.TOUCH_END, this.calculateTouchEmulatorCoordinates(event.nativeEvent));
      }
    };

    this.handleMouseMove = event => {
      // Mouse button needs to be pressed before triggering move
      if (!_reactDeviceDetect.isMobile && this.mouseDown) {
        this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);
      }
    };

    this.handleKey = key => {
      return event => {
        // Block sending Alt key, as it opens keyboard
        if (event.key === 'Alt') {
          return;
        }

        const request = new Proto.KeyboardEvent();
        const eventType = key === 'KEYDOWN' ? Proto.KeyboardEvent.KeyEventType.KEYDOWN : key === 'KEYUP' ? Proto.KeyboardEvent.KeyEventType.KEYUP : Proto.KeyboardEvent.KeyEventType.KEYPRESS;
        request.setEventtype(eventType);
        request.setKey(event.key);
        this.sendInput('keyboard', request);
      };
    };

    this.preventDragHandler = event => {
      event.preventDefault();
    };

    this.enterFullScreen = () => {
      if (this.props.enableFullScreen && _screenfull.default.isEnabled && !_screenfull.default.isFullscreen) {
        _screenfull.default.request().then(() => {
          const orientation = this.props.emulatorWidth > this.props.emulatorHeight ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT;
          window.screen.orientation.lock(orientation).catch(error => {
            this.props.logger.log('Failed to lock screen orientation to: ' + error);
          });
        }).catch(error => {
          this.props.logger.log('Failed to request fullscreen: ' + error);
        });
      }
    };

    this.handler = /*#__PURE__*/_react.default.createRef();
    const {
      emulator
    } = props;
    this.status = new _EmulatorStatus.default(emulator);
    this.mouseDown = false;
    this.userInteractionHoldOff = 0;
    this.touchIdentifiersHistory = {};
    this.touchHistory = [];
  }

  updateTouchHandler() {
    this.touchHandler = function (type, allEvents, events) {
      return this.sendMultiTouch(type, allEvents, events);
    };
  }

  componentDidUpdate() {
    this.updateTouchHandler();
  }

  componentDidMount() {
    this.updateTouchHandler(); // Disabling passive mode to be able to call 'event.preventDefault()' for disabling scroll, which causing
    // laggy touch move performance on mobile phones, since some browsers changed default passive: true from false
    // related issue: https://github.com/facebook/react/issues/9809

    this.handler.current.addEventListener('touchmove', this.preventDefault, {
      passive: false
    });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    this.handler.current.removeEventListener('touchmove', this.preventDefault, {
      passive: false
    });
    window.removeEventListener('resize', this.handleResize);

    if (this.props.enableFullScreen && _screenfull.default.isEnabled && _screenfull.default.isFullscreen) {
      try {
        window.screen.orientation.unlock().catch(() => {});
      } catch (e) {// We ignore if the system fails to perform unlock(), typical due to we were not in a locked mode previously,
        // or we are on iOS Safari, where the feature is not supported.
      }
    }
  }

  /**
   *
   * @param {number} offsetX
   * @param {number} offsetY
   * @param {number} clientWidth
   * @param {number} clientHeight
   * @returns {{x: number, y: number}}
   */
  calculateEmulatorCoordinates(offsetX, offsetY, clientWidth, clientHeight) {
    /**
     * Calculation and mapping of the coordinates against the emulator screen is done in following steps:
     * 1. Calculate where on the screen active area (the area assigned for the stream to be visible on) the
     *    user click/touch and return it as a percentage value from 0 to 1 in the variable `eventOffset`
     * 2. Identify if the screen is wider or narrower then the emulator for understanding if we have
     *    black border on top/bottom or on the sides, the result is saved into `emulatorIsUsingFullHeight`
     * 3. Dependent if the screen is full height or not the follow steps will be applied:
     *    A: Calculate `scaleFactor` - percentage of how much space the emulator takes
     *       compared to existing space in the active area, eg. if emulator takes up 50 of the screen width we get
     *       a value 0.5 where 25% of the screen on each side is a black border.
     *    B: Convert the `eventOffset` to the real offset after taking into account the emulator did not took
     *       the full space that was available for moving user click/touch position inside the emulator area and then calculate the a value from 0 to 1
     *       within the emulator viewport.
     *    C: Convert and return the values in percentage to the real pixels where the user clicks on using knowledge about
     *       exactly how big the emulator screen is.
     */
    const {
      emulatorHeight,
      emulatorWidth
    } = this.props;
    const eventOffset = {
      x: this.withinInterval(0, offsetX / clientWidth, 1),
      y: this.withinInterval(0, offsetY / clientHeight, 1)
    };
    const emulatorIsUsingFullHeight = emulatorHeight / emulatorWidth > clientHeight / clientWidth;

    if (emulatorIsUsingFullHeight) {
      const scaleFactor = clientHeight * emulatorWidth / (emulatorHeight * clientWidth);
      const scaledTo = Math.round(this.withinInterval(0, (eventOffset.x - 0.5) / scaleFactor + 0.5, 1) * emulatorWidth) || 0;
      return {
        x: this.withinInterval(1, scaledTo, emulatorWidth),
        y: this.withinInterval(1, Math.round(eventOffset.y * emulatorHeight) || 0, emulatorHeight)
      };
    } else {
      const scaleFactor = clientWidth * emulatorHeight / (emulatorWidth * clientHeight);
      const scaledTo = Math.round(this.withinInterval(0, (eventOffset.y - 0.5) / scaleFactor + 0.5, 1) * emulatorHeight) || 0;
      return {
        x: this.withinInterval(1, Math.round(eventOffset.x * emulatorWidth) || 0, emulatorWidth),
        y: this.withinInterval(1, scaledTo, emulatorHeight)
      };
    }
  }
  /**
   * Get a value and truncate it to always be between the min and max value
   * @param {number} minValue
   * @param {number} value
   * @param {number} maxValue
   * @returns {number}
   */


  withinInterval(minValue, value, maxValue) {
    return Math.max(Math.min(value, maxValue), minValue);
  }
  /**
   *
   * @param emulatorCords {{x: number, y: number}}
   * @param mouseButton
   */


  render() {
    const View = this.props.view;
    return /*#__PURE__*/_react.default.createElement("div", {
      onMouseDown: this.handleMouseDown,
      onMouseMove: this.handleMouseMove,
      onMouseUp: this.handleMouseUp,
      onMouseOut: this.handleMouseUp,
      onKeyDown: this.handleKey('KEYDOWN'),
      onKeyUp: this.handleKey('KEYUP'),
      onTouchStart: this.handleTouchStart,
      onTouchEnd: this.handleTouchEnd,
      onTouchMove: this.handleTouchMove,
      onDragStart: this.preventDragHandler,
      tabIndex: "0",
      ref: this.handler,
      style: {
        pointerEvents: 'all',
        outline: 'none',
        margin: '0',
        padding: '0',
        border: '0',
        display: 'inline-block',
        width: '100%',
        height: '100%'
      }
    }, /*#__PURE__*/_react.default.createElement(View, this.props));
  }

}

exports.default = EventHandler;
EventHandler.propTypes = {
  emulator: _propTypes.default.object.isRequired,
  jsep: _propTypes.default.object.isRequired,
  enableControl: _propTypes.default.bool,
  enableFullScreen: _propTypes.default.bool,
  logger: _propTypes.default.object.isRequired,
  emulatorWidth: _propTypes.default.number,
  emulatorHeight: _propTypes.default.number,
  emulatorVersion: _propTypes.default.string,
  view: _propTypes.default.any.isRequired,
  edgeNodeId: _propTypes.default.string.isRequired,
  // report events during the streaming view.
  volume: _propTypes.default.number,
  muted: _propTypes.default.bool,
  measureTouchRtt: _propTypes.default.bool
};
EventHandler.defaultProps = {
  emulatorHeight: 768,
  emulatorWidth: 432
};