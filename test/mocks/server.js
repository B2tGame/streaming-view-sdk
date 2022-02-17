import { rest } from 'msw';
import { setupServer } from 'msw/node';
import uuid from './uuid';

export const server = setupServer(
  rest.post('http://localhost/api/streaming-games/edge-node/device-info', (req, res, ctx) => {
    return res(
      ctx.json({
        deviceInfoId: uuid()
      })
    );
  }),
  rest.post('http://localhost/api/streaming-games/edge-node/device-info/:deviceInfoId', (req, res, ctx) => {
    return res();
  })
);
