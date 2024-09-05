import express from 'express';

const router = express.Router();

type CredentialResponse = string[];

router.get<{}, CredentialResponse>('/', (req, res) => {
  res.json(['ok']);
});

export default router;
