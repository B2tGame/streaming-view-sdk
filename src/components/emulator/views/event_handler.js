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
import React from "react";
import * as Proto from "../../../proto/emulator_controller_pb";
import EmulatorStatus from "../net/emulator_status";

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
        deviceHeight: 1920,
        deviceWidth: 1080,
        mouse: {
          xp: 0,
          yp: 0,
          mouseDown: false, // Current state of mouse
          // Current button pressed.
          // In proto, 0 is "no button", 1 is left, and 2 is right.
          mouseButton: 0
        }
      };
      this.handler = React.createRef();
      const { emulator } = this.props;
      this.status = new EmulatorStatus(emulator);
    }

    componentDidMount() {
      this.getScreenSize();
    }

    getScreenSize() {
      this.status.updateStatus(state => {
        this.setState({
          deviceWidth: parseInt(state.hardwareConfig["hw.lcd.width"]) || 1080,
          deviceHeight: parseInt(state.hardwareConfig["hw.lcd.height"]) || 1920
        });
      });
    }

    onContextMenu = e => {
      e.preventDefault();
    };

    setCoordinates = () => {
      // It is totally possible that we send clicks that are offscreen..
      const { deviceWidth, deviceHeight } = this.state;
      const { mouseDown, mouseButton, xp, yp } = this.state.mouse;
      const { clientHeight, clientWidth } = this.handler.current;
      const scaleX = deviceWidth / clientWidth;
      const scaleY = deviceHeight / clientHeight;
      const x = Math.round(xp * scaleX);
      const y = Math.round(yp * scaleY);

      if (isNaN(x) || isNaN(y)) {
        console.log("Ignoring: x: " + x + ", y:" + y);
        return;
      }

      // Forward the request to the jsep engine.
      var request = new Proto.MouseEvent();
      request.setX(x);
      request.setY(y);
      request.setButtons(mouseDown ? mouseButton : 0);
      const { jsep } = this.props;
      jsep.send("mouse", request);
    };

    handleKey = eventType => {
      return e => {
        var request = new Proto.KeyboardEvent();
        request.setEventtype(
          eventType === "KEYDOWN"
            ? Proto.KeyboardEvent.KeyEventType.KEYDOWN
            : eventType === "KEYUP"
            ? Proto.KeyboardEvent.KeyEventType.KEYUP
            : Proto.KeyboardEvent.KeyEventType.KEYPRESS
        );
        request.setKey(e.key);
        const { jsep } = this.props;
        jsep.send("keyboard", request);
      };
    };

    // Properly handle the mouse events.
    handleMouseDown = e => {
      console.log("handleMouseDown " + e);
      const { offsetX, offsetY } = e.nativeEvent;
      this.setState(
        {
          mouse: {
            xp: offsetX,
            yp: offsetY,
            mouseDown: true,
            // In browser's MouseEvent.button property,
            // 0 stands for left button and 2 stands for right button.
            mouseButton: e.button === 0 ? 1 : e.button === 2 ? 2 : 0
          }
        },
        this.setCoordinates
      );
    };

    handleOffScreenCase = (xp, yp, isOffScreen) => {

      /*
      deviceHeight: 768
      deviceWidth: 432
       */

      // It is totally possible that we send clicks that are offscreen..
      const { deviceWidth, deviceHeight } = this.state;
      var { mouseDown, mouseButton } = this.state.mouse;
      const { clientHeight, clientWidth } = this.handler.current;
      const scaleX = deviceWidth / clientWidth;
      const scaleY = deviceHeight / clientHeight;
      const x = Math.round(xp * scaleX);
      const y = Math.round(yp * scaleY);

      const deviceRatio = deviceWidth / deviceHeight;
      const innerRatio = clientWidth / clientHeight;

      const isOffRatio =  false;

      // const {
      //   deviceRatio,
      //   innerRatio,
      //   isOffRatio,
      //   innerWidth,
      //   innerHeight,
      //   emulatorWith,
      //   emulatorHeight,
      //   scaleX,
      //   scaleY,
      // } = this.state;

      // if (scaleX === undefined || isNaN(scaleX)) {
      //   this.updateScales();
      // }

      if (isOffRatio) {
        if (innerRatio < deviceRatio) {
          // we have a wide screen with empty space next to the emulator stream
          const emulatorStarX = Math.round((innerWidth - deviceWidth) / 2);
          const emulatorEndX = innerWidth - emulatorStarX;
          isOffScreen = xp < emulatorStarX || xp > emulatorEndX;
          xp -= emulatorStarX;
        } else {
          // we have a narrow screen with empty space above and under the emulator stream
          const emulatorStarY = Math.round((innerHeight - deviceWidth) / 2);
          const emulatorEndY = innerHeight - emulatorStarY;
          isOffScreen = yp < emulatorStarY || yp > emulatorEndY;
          yp -= emulatorStarY;
        }
      }

      return {
        xp: Math.round(xp / scaleX),
        yp: Math.round(yp / scaleY),
        isOffScreen: isOffScreen,
      };
    };

    handleTouchStart = e => {
      console.log("handleTouchStart" + e);
      this.setTouchCoordinates(e.nativeEvent.touches);
    };


    handleTouchEnd = e => {
      console.log("handleTouchEnd" + e);

      const protoTouch = new Proto.Touch();
      protoTouch.setX(0);
      protoTouch.setY(0);
      protoTouch.setIdentifier(0);
      protoTouch.setPressure(0);
      protoTouch.setTouchMajor(0);
      protoTouch.setTouchMinor(0);

      // Make the grpc call.
      const requestTouchEvent = new Proto.TouchEvent();
      requestTouchEvent.setTouchesList([protoTouch]);
      const { jsep } = this.props;
      jsep.send('touch', requestTouchEvent);
    };


    handleTouchMove = e => {
      console.log("handleTouchMove" + e);
      this.setTouchCoordinates(e.nativeEvent.touches);
    };

    setTouchCoordinates = (touches) => {
      let identifierForSafari = 0;
      const touchesToSend = Object.keys(touches)
          .map((index) => {
            const touch = touches[index];
            const { clientX, clientY, radiusX, radiusY } = touch;
            let { identifier } = touch;
            // Iphone Safari triggering touch events with negative identifiers like (-1074001159) and identifiers
            // are different for every touch (same for touch move), what breaking execution of touch events
            // if (isIOS) {
            //   identifier = identifierForSafari++;
            // }

            let xp = clientX;
            let yp = clientY;

            let isOffScreen = false;
            ({ xp, yp, isOffScreen } = this.handleOffScreenCase(xp, yp, isOffScreen));

            if (isOffScreen) {
              return undefined;
            }

            const protoTouch = new Proto.Touch();


            protoTouch.setX(xp);
            protoTouch.setY(yp);
            protoTouch.setIdentifier(3);
            protoTouch.setPressure(1);

            const touchMinor = Math.round(Math.max(2, Math.min(2 * radiusX, 2 * radiusY)));
            protoTouch.setTouchMinor(touchMinor);

            const touchMajor = Math.round(Math.max(2 * radiusX, 2 * radiusY, 10));
            protoTouch.setTouchMajor(touchMajor);


            console.log("meeeeeeeeeeeeeeeeeh " + "xp: " + xp + " " +
                "yp: " + yp + " " +
                "xp: " + xp + " " +
                "identifier: " + identifier + " " +
                "touchMinor: " + touchMinor + " " +
                "touchMajor: " + touchMajor + " ");

            return protoTouch;
          })
          .filter((value) => value !== undefined);

      // Make the grpc call.
      const requestTouchEvent = new Proto.TouchEvent();
      requestTouchEvent.setTouchesList(touchesToSend);

      const { jsep } = this.props;
      jsep.send('touch', requestTouchEvent);
    };


    handleMouseUp = e => {
      const { offsetX, offsetY } = e.nativeEvent;
      this.setState(
        {
          mouse: { xp: offsetX, yp: offsetY, mouseDown: false, mouseButton: 0 }
        },
        this.setCoordinates
      );
    };

    handleMouseMove = e => {
      // Let's not overload the endpoint with useless events.
      if (!this.state.mouse.mouseDown)
        return;

      const { offsetX, offsetY } = e.nativeEvent;
      var mouse = this.state.mouse;
      mouse.xp = offsetX;
      mouse.yp = offsetY;
      this.setState({ mouse: mouse }, this.setCoordinates);
    };

    preventDragHandler = e => {
      e.preventDefault();
    };

    render() {
      return (
        <div /* handle interaction */
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onMouseOut={this.handleMouseUp}
          onKeyDown={this.handleKey("KEYDOWN")}
          onKeyUp={this.handleKey("KEYUP")}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
          onTouchMove={this.handleTouchMove}
          onDragStart={this.preventDragHandler}
          tabIndex="0"
          ref={this.handler}
          style={{
            pointerEvents: "all",
            outline: "none",
            margin: "0",
            padding: "0",
            border: "0",
            display: "inline-block",
            width: "100%"
          }}
        >
          <WrappedComponent {...this.props} />
        </div>
      );
    }
  };
}
