/*
 * Copyright 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as Proto from '../../../proto/emulator_controller_pb';
import EmulatorStatus from '../net/emulator_status';
import { isMobile } from 'react-device-detect';
import screenfull from 'screenfull';

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
export default function withMouseKeyHandler(WrappedComponent) {
  return class extends Component {
    static propTypes = {
      emulator: PropTypes.object.isRequired,
      jsep: PropTypes.object.isRequired,
      enableControl: PropTypes.bool,
      enableFullScreen: PropTypes.bool,
      screenOrientation: PropTypes.oneOf(['portrait', 'landscape']),
      onUserInteraction: PropTypes.func,
    };

    constructor(props) {
      super(props);
      this.state = {
        deviceHeight: 768,
        deviceWidth: 432,
        mouseDown: false,
      };
      this.handler = React.createRef();
      const { emulator } = this.props;
      this.status = new EmulatorStatus(emulator);
      this.browser = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }

    componentDidMount() {
      this.getScreenSize();
    }

    getScreenSize() {
      this.status.updateStatus((state) => {
        this.setState({
          deviceWidth: parseInt(state.hardwareConfig['hw.lcd.width']) || this.state.deviceWidth,
          deviceHeight: parseInt(state.hardwareConfig['hw.lcd.height']) || this.state.deviceHeight,
        });
      });
    }

    handleUserInteraction = () => {
      // Trigger passed hook onUserInteraction
      this.props.onUserInteraction();
      this.enterFullScreen();
    };

    onContextMenu = (e) => {
      e.preventDefault();
    };

    /**
     *
     * @param event
     * @returns {{x: number, y: number}}
     */
    calculateMouseEmulatorCoordinates = (event) => {
      const { offsetX, offsetY } = event;
      const { clientWidth, clientHeight } = event.target;

      return this.calculateEmulatorCoordinates(offsetX, offsetY, clientWidth, clientHeight);
    };

    /**
     *
     * @param event
     * @returns {{x: number, y: number}}
     */
    calculateTouchEmulatorCoordinates = (event) => {
      const { clientX, clientY } = event;
      const { clientWidth, clientHeight, offsetLeft, offsetTop } = event.target;

      const offsetX = clientX - offsetLeft;
      const offsetY = clientY - offsetTop;

      return this.calculateEmulatorCoordinates(offsetX, offsetY, clientWidth, clientHeight);
    };

    /**
     * Calculate coordinates for the emulator from client offset coordinates
     * @param offsetX
     * @param offsetY
     * @param clientWidth
     * @param clientHeight
     * @returns {{x: number, y: number}}
     */
    calculateEmulatorCoordinates = (offsetX, offsetY, clientWidth, clientHeight) => {
      const xEmulatorCoordinate = (offsetX / clientWidth) * this.state.deviceWidth;
      const yEmulatorCoordinate = (offsetY / clientHeight) * this.state.deviceHeight;

      return {
        x: Math.round(xEmulatorCoordinate),
        y: Math.round(yEmulatorCoordinate),
      };
    };

    /**
     *
     * @param event
     * @param mouseButton
     */
    sendMouse = (event, mouseButton) => {
      const emulatorCords = this.calculateMouseEmulatorCoordinates(event);
      const request = new Proto.MouseEvent();
      request.setX(emulatorCords.x);
      request.setY(emulatorCords.y);
      request.setButtons(mouseButton === 0 ? 1 : 0);

      this.sendInput('mouse', request);
    };

    sendTouch = (event, mouseButton) => {
      const emulatorCords = this.calculateTouchEmulatorCoordinates(event);
      const request = new Proto.MouseEvent();
      request.setX(emulatorCords.x);
      request.setY(emulatorCords.y);
      request.setButtons(mouseButton === 0 ? 1 : 0);

      this.sendInput('mouse', request);
    };

    /**
     * Send input if input control was enabled
     * @param label Input type can be [mouse|keyboard/touch]
     * @param request
     */
    sendInput = (label, request) => {
      this.handleUserInteraction();

      if (this.props.enableControl) {
        this.props.jsep.send(label, request);
      }
    };

    handleTouchStart = (event) => {
      this.sendTouch(event.nativeEvent.touches[0], 0);
    };

    handleTouchEnd = (event) => {
      this.sendTouch(event.nativeEvent.changedTouches[0]);
    };

    handleTouchMove = (event) => {
      this.sendTouch(event.nativeEvent.touches[0], 0);
    };

    // Properly handle the mouse events.
    handleMouseDown = (event) => {
      if (!isMobile) {
        this.setState({ mouseDown: true });
        this.sendMouse(event.nativeEvent, event.button);
      }
    };

    handleMouseUp = (event) => {
      // Don't release mouse when not pressed
      if (!isMobile && this.state.mouseDown) {
        this.setState({ mouseDown: false });
        this.sendMouse(event.nativeEvent);
      }
    };

    handleMouseMove = (event) => {
      // Mouse button needs to be pressed before triggering move
      if (!isMobile && this.state.mouseDown) {
        this.sendMouse(event.nativeEvent, event.button);
      }
    };

    handleKey = (key) => {
      return (event) => {
        // Block sending Alt key, as it opens keyboard
        if (event.key === 'Alt') {
          return;
        }

        const request = new Proto.KeyboardEvent();
        const eventType =
          key === 'KEYDOWN'
            ? Proto.KeyboardEvent.KeyEventType.KEYDOWN
            : key === 'KEYUP'
            ? Proto.KeyboardEvent.KeyEventType.KEYUP
            : Proto.KeyboardEvent.KeyEventType.KEYPRESS;
        request.setEventtype(eventType);
        request.setKey(event.key);
        this.sendInput('keyboard', request);
      };
    };

    preventDragHandler = (event) => {
      event.preventDefault();
    };

    enterFullScreen = () => {
      if (this.props.enableFullScreen && screenfull.isEnabled && !screenfull.isFullscreen) {
        screenfull
          .request()
          .then(() => {
            window.screen.orientation.lock(this.props.screenOrientation).catch((error) => {
              console.log('Failed to lock screen orientation to:', error);
            });
          })
          .catch((error) => {
            console.log('Failed to request fullscreen:', error);
          });
      }
    };

    render() {
      return (
        <div
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onMouseOut={this.handleMouseUp}
          onKeyDown={this.handleKey('KEYDOWN')}
          onKeyUp={this.handleKey('KEYUP')}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
          onTouchMove={this.handleTouchMove}
          onDragStart={this.preventDragHandler}
          tabIndex='0'
          ref={this.handler}
          style={{
            pointerEvents: 'all',
            outline: 'none',
            margin: '0',
            padding: '0',
            border: '0',
            display: 'inline-block',
            width: '100%',
          }}
        >
          <WrappedComponent
            {...this.props}
            deviceHeight={this.state.deviceHeight}
            deviceWidth={this.state.deviceWidth}
          />
        </div>
      );
    }
  };
}
