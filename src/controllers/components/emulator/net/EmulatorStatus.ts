import { Empty } from 'google-protobuf/google/protobuf/empty_pb.js';
import { EmulatorControllerService } from '../../../proto/emulator_web_client.js';
import { VmConfiguration } from '../../../proto/emulator_controller_pb.js';

type StatusData = {
  version: string;
  uptime: number;
  booted: boolean;
  hardwareConfig: any;
  vmConfig: {
    hypervisorType?: VmConfiguration.VmHypervisorType;
    numberOfCpuCores?: number;
    ramSizeBytes?: number;
  };
};

/**
 * Gets the status of the emulator, parsing the hardware config into something
 * easy to digest.
 *
 * @export
 * @class EmulatorStatus
 */
class EmulatorStatus {
  emulator: EmulatorControllerService;
  status?: StatusData;
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
  constructor(uriOrEmulator: string | EmulatorControllerService, auth?: null) {
    if (uriOrEmulator instanceof EmulatorControllerService) {
      this.emulator = uriOrEmulator;
    } else {
      this.emulator = new EmulatorControllerService(uriOrEmulator);
    }
  }

  /**
   * Gets the cached status.
   *
   * @memberof EmulatorStatus
   */
  getStatus = () => {
    return this.status;
  };

  /**
   * Retrieves the current status from the emulator.
   *
   * @param  fnNotify when the status is available, returns the retrieved status.
   * @param  cache True if the cache can be used.
   * @memberof EmulatorStatus
   */
  updateStatus = (fnNotify: (status: StatusData) => void, cache?: boolean) => {
    const request = new Empty();
    if (cache && this.status) {
      fnNotify(this.status);
      return this.status;
    }
    this.emulator.getStatus(request, {}, (err, response) => {
      const hwConfig: any = {};
      // Don't get configuration if emulator is unreachable
      if (!response) {
        return;
      }

      const entryList = response.getHardwareconfig()?.getEntryList() ?? [];
      for (var i = 0; i < entryList.length; i++) {
        const key = entryList[i].getKey();
        const val = entryList[i].getValue();
        hwConfig[key] = val;
      }

      const vmConfig = response.getVmconfig();
      this.status = {
        version: response.getVersion(),
        uptime: response.getUptime(),
        booted: response.getBooted(),
        hardwareConfig: hwConfig,
        vmConfig: {
          hypervisorType: vmConfig?.getHypervisortype(),
          numberOfCpuCores: vmConfig?.getNumberofcpucores(),
          ramSizeBytes: vmConfig?.getRamsizebytes(),
        },
      };
      fnNotify(this.status);
    });
  };
}

export default EmulatorStatus;
