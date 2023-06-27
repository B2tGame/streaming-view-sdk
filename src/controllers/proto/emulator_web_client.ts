/*
 * Copyright 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import { EmulatorControllerClient } from '../proto/Emulator_controllerServiceClientPb.js';
import { RtcClient } from '../proto/Rtc_serviceServiceClientPb.js';
import { GrpcWebClientBase, GrpcWebClientBaseOptions, Metadata, MethodDescriptor, RpcError } from 'grpc-web';
import { EventEmitter } from 'events';

export interface Authenticator<Header extends object = {}> {
  authHeader: () => Header;
  unauthorized: () => void;
}

export class NopAuthenticator implements Authenticator<{}> {
  authHeader = () => {
    return {};
  };

  unauthorized = () => {};
}

/**
 * A GrcpWebClientBase that inject authentication headers and intercepts
 * errors. If the errors are 401, the unauthorized method of the authenticator will be invoked.
 *
 * @export
 * @class EmulatorWebClient
 * @extends {GrpcWebClientBase}
 */
class EmulatorWebClient extends GrpcWebClientBase {
  events: EventEmitter;
  constructor(options: GrpcWebClientBaseOptions, readonly auth: Authenticator) {
    super(options);
    this.events = new EventEmitter();
    this.events.on('error', (e: any) => {
      console.log('low level gRPC error: ' + JSON.stringify(e));
    });
  }

  on = (name: string, fn: (v: any) => void) => {
    this.events.on(name, fn);
  };

  rpcCall = <REQ, RESP>(
    method: string,
    request: REQ,
    metadata: Metadata,
    methodDescriptor: MethodDescriptor<REQ, RESP>,
    callback: (err: RpcError, response: RESP) => void
  ) => {
    const authHeader = this.auth.authHeader();
    const meta = { ...metadata, ...authHeader };
    const self = this;
    return super.rpcCall(method, request, meta, methodDescriptor, (err, res) => {
      if (err) {
        if (err.code === 401) self.auth.unauthorized();
        if (self.events) self.events.emit('error', err);
      }
      if (callback) callback(err, res);
    });
  };

  serverStreaming = <REQ, RESP>(method: string, request: REQ, metadata: Metadata, methodDescriptor: MethodDescriptor<REQ, RESP>) => {
    const authHeader = this.auth.authHeader();
    const meta = { ...metadata, ...authHeader };
    const stream = super.serverStreaming(method, request, meta, methodDescriptor);
    const self = this;

    // Intercept errors.
    stream.on('error', (e) => {
      if (e.code === 401) {
        self.auth.unauthorized();
      }
      self.events.emit('error', e);
    });
    return stream;
  };
}

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
export class EmulatorControllerService extends EmulatorControllerClient {
  client_: EmulatorWebClient;

  /**
   *Creates an instance of EmulatorControllerService.
   * @param {string} uri of the emulator controller endpoint.
   * @param {Authenticator} authenticator used to authenticate with the emulator endpoint.
   * @param onError callback that will be invoked when a low level gRPC error arises.
   * @memberof EmulatorControllerService
   */
  constructor(uri: string, authenticator?: Authenticator, onError?: (e: Error) => void) {
    super(uri);
    if (!authenticator) authenticator = new NopAuthenticator();
    this.client_ = new EmulatorWebClient({}, authenticator);
    if (onError)
      this.client_.on('error', (e) => {
        onError(e);
      });
  }
}

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
export class RtcService extends RtcClient {
  client_: EmulatorWebClient;
  /**
   *Creates an instance of RtcService.
   * @param {string} uri of the emulator controller endpoint.
   * @param {Authenticator} authenticator used to authenticate with the emulator endpoint.
   * @param onError callback that will be invoked when a low level gRPC error arises.
   * @memberof RtcService
   */
  constructor(uri: string, authenticator: Authenticator, onError?: (e: Error) => void) {
    super(uri);
    if (!authenticator) authenticator = new NopAuthenticator();
    this.client_ = new EmulatorWebClient({}, authenticator);
    if (onError)
      this.client_.on('error', (e) => {
        onError(e);
      });
  }
}
