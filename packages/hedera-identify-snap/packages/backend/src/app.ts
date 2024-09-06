import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import * as middlewares from './middlewares.js';
import api from './api/index.js';
import MessageResponse from './interfaces/MessageResponse';
import { setupAgent, getAgent } from './veramo/setup';

import('dotenv').then((dotenv) => {
  dotenv.config();
});

const app = express();

// const init = async () => {
//   await setupAgent();

//   let agent = await getAgent();
//   console.log("1-----------");
//   let privateKey = "2386d1d21644dc65d4e4b9e2242c5f155cab174916cbc46ad85622cdaeac835c";
//   await agent.keyManagerImport({ kms: "local", type: 'Secp256k1', privateKeyHex: privateKey as string });
// }

// Promise.all([init]);

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1', api);
app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
