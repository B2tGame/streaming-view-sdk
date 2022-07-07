import axios from 'axios';

/**
 *
 * @param {string} apiEndpoint
 * @param {string} edgeNodeId
 * @returns {Promise<{ name: string, candidates: [{*}]}>}
 */
function requestIceServers(apiEndpoint, edgeNodeId) {
  return axios
    .get(`${apiEndpoint}/api/streaming-games/edge-node/ice-server/edge-node/${edgeNodeId}`, { timeout: 10000 })
    .then((result) => result.data || {});
}

export { requestIceServers };
