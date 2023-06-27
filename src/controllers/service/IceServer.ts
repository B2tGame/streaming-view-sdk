import axios from 'axios';

export type IceServerCandidate = {
  username: string;
  credential: string;
  urls: string[];
};
export type IceServerInfo = { name: string; candidates: IceServerCandidate[] };

export function requestIceServers(apiEndpoint: string, edgeNodeId: string): Promise<IceServerInfo> {
  return axios
    .get(`${apiEndpoint}/api/streaming-games/edge-node/ice-server/edge-node/${edgeNodeId}`, { timeout: 10000 })
    .then((result) => result.data || {});
}
