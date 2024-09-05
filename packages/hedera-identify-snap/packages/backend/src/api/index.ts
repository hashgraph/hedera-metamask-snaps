import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import credentialRouter from './credential';
import emojiRouter from './emoji';

const router = express.Router();

router.use('/credential', credentialRouter);
router.use('/emoji', emojiRouter);
router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

export default router;
