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
import React from 'react';
import * as Proto from '../../../proto/emulator_controller_pb';
import EmulatorStatus from '../net/emulator_status';
import { isMobile, isIOS } from 'react-device-detect';
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
  return class extends React.Component {
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

    onContextMenu = (e) => {
      e.preventDefault();
    };

    convertTouchCoordinates = (touches) => {
      let identifierForSafari = 0;
      const touchCordinates = Object.keys(touches)
        .map((index) => {
          const touch = touches[index];
          const { clientX, clientY, radiusX, radiusY } = touch;
          const { offsetTop, offsetLeft } = this.handler.current;
          let { identifier } = touch;
          const cords = { x: clientX - offsetLeft, y: clientY - offsetTop };
          // Iphone Safari triggering touch events with negative identifiers like (-1074001159) and identifiers
          // are different for every touch (same for touch move), what breaking execution of touch events
          // if (isIOS) {
          //   identifier = identifierForSafari++;
          return cords;
        })
        .filter((value) => value !== undefined)
        .shift();
      return touchCordinates;
    };

    /**
     * @param event Native event
     * @returns {{x: number, y: number}}
     */
    calculateEmulatorCoordinates = (event) => {
      const { offsetX, offsetY } = event;
      const { clientWidth, clientHeight } = event.target;

      const xEmulatorCoordinate = (offsetX / clientWidth) * this.state.deviceWidth;
      const yEmulatorCoordinate = (offsetY / clientHeight) * this.state.deviceHeight;

      return {
        x: Math.round(xEmulatorCoordinate),
        y: Math.round(yEmulatorCoordinate),
      };
    };

    /**
     * @param event Native event
     * @returns {{x: number, y: number}}
     */
    calculateEmulatorCoordinatesForTouch = (event) => {
      // Coordinates are not with offset, different to click mouse event
      const { clientX, clientY } = event;
      console.log('event', event);
      const { clientWidth, clientHeight } = event.target;

      // Touched are not reporting offsets
      const xEmulatorCoordinate =
        ((clientX - (this.browser.width - clientWidth) / 2) / clientWidth) * this.state.deviceWidth;
      const yEmulatorCoordinate =
        ((clientY - (this.browser.height - clientHeight) / 2) / clientHeight) * this.state.deviceHeight;

      return {
        x: Math.round(xEmulatorCoordinate),
        y: Math.round(yEmulatorCoordinate),
      };
    };

    sendMouse = (event, mouseButton) => {
      const emulatorCords = this.calculateEmulatorCoordinates(event.nativeEvent);
      const request = new Proto.MouseEvent();
      request.setX(emulatorCords.x);
      request.setY(emulatorCords.y);
      request.setButtons(mouseButton === 0 ? 1 : 0);

      this.props.jsep.send('mouse', request);
    };

    sendTouch = (coors, mouseButton) => {
      const request = new Proto.MouseEvent();
      request.setX(coors.x);
      // Temp "fix" until real touch events will be supported
      request.setY(coors.y - 20);
      request.setButtons(mouseButton === 0 ? 1 : 0);

      this.props.jsep.send('mouse', request);
    };

    handleTouchStart = (event) => {
      this.enterFullScreen();
      const emulatorCords = this.calculateEmulatorCoordinatesForTouch(event.nativeEvent.touches[0]);
      this.sendTouch(emulatorCords, 0);
    };

    handleTouchEnd = (event) => {
      this.enterFullScreen();
      const emulatorCords = this.calculateEmulatorCoordinatesForTouch(event.nativeEvent.changedTouches[0]);
      this.sendTouch(emulatorCords);
    };

    handleTouchMove = (event) => {
      this.enterFullScreen();
      const cords = this.calculateEmulatorCoordinatesForTouch(event.nativeEvent.touches[0]);
      this.sendTouch(cords, 0);
    };

    // Properly handle the mouse events.
    handleMouseDown = (event) => {
      if (!isMobile) {
        this.enterFullScreen();
        this.setState({ mouseDown: true });
        this.sendMouse(event, event.button);
      }
    };

    handleMouseUp = (event) => {
      // Don't release mouse when not pressed
      if (!isMobile && this.state.mouseDown) {
        this.enterFullScreen();
        this.setState({ mouseDown: false });
        this.sendMouse(event);
      }
    };

    handleMouseMove = (event) => {
      // Mouse button needs to be pressed before triggering move
      if (!isMobile && this.state.mouseDown) {
        this.enterFullScreen();
        this.sendMouse(event, event.button);
      }
    };

    handleKey = (eventType) => {
      return (event) => {
        const request = new Proto.KeyboardEvent();
        const eventType =
          eventType === 'KEYDOWN'
            ? Proto.KeyboardEvent.KeyEventType.KEYDOWN
            : eventType === 'KEYUP'
            ? Proto.KeyboardEvent.KeyEventType.KEYUP
            : Proto.KeyboardEvent.KeyEventType.KEYPRESS;

        request.setEventtype(eventType);
        request.setKey(event.key);

        this.props.jsep.send('keyboard', request);
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
