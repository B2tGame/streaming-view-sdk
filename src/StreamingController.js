import axios from 'axios';
import rp from 'request-promise';

/**
 * Streamingcontroller is responsible for controlling the edge node for example terminate it.
 *
 * @class StreamingController
 * 
 */
class StreamingController {
  constructor(props) {
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId;
  }
  /**
   * terminate the instance
   * @returns {Promise<*>} 
   */
  terminate = () => {
    return axios.get( `${this.apiEndpoint}/${this.edgeNodeId}/emulator-commands/terminate`);
  };
}


const getStatus = (uri, timeOut) =>{
return new Promise(
  resolve => {
    setTimeout(() => resolve(rp.get({uri: uri, json:true})), timeOut);
  }
)
}

const pollStreamStatus = (apiEndpoint, edgeNodeId, maxRetry) => {
  const loop = retrysLeft => getStatus(`${apiEndpoint}/api/streaming-games/status/${edgeNodeId}`, 1000)
  .then(result => {
    if (result.state === 'ready') {
      console.log("Edge Node controller is 'ready'!");
      return result
    }else if (retrysLeft) {
      return loop(retrysLeft-1)
    }else{
      return result;
    }
  })

  return loop(maxRetry);

}


/**
 * Instanciating the StreamingController
 * @returns {Promise<StreamingController>}
 */
export default (props) => {
  return pollStreamStatus(props.apiEndpoint, props.edgeNodeId,10)
  .then(result => {
    if(result.state === 'ready'){
      return new StreamingController({apiEndpoint:result.endpoint, edgeNodeId:props.edgeNodeId})
    }else{
      return null;
    }
  })
}