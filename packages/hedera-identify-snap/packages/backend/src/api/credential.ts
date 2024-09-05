import { VerifiableCredential, VerifiablePresentation } from '@veramo/core';
import axios from 'axios';
import crypto from 'crypto';
import express from 'express';
import jwt_decode from 'jwt-decode';
import cloneDeep from 'lodash.clonedeep';
import NodeCache from 'node-cache';
import * as middlewares from '../middlewares';
import { getAgent } from '../veramo/setup';

const router = express.Router();

const cache = new NodeCache();

router.use(middlewares.init);
router.post('/register/', async (req, res) => {
  console.log(`body${JSON.stringify(req.body)}`);

  const intoriAgentHeaders = {
    accept: 'application/json; charset=utf-8',
    Authorization: `Bearer ${process.env.INTORI_AGENT_API_KEY}`,
    'Content-Type': 'application/json',
  };

  let verifiableCredential;
  if (process.env.INTORI_AGENT_USE) {
    const issuanceDate = new Date();
    // Set the expiration date to be 1 year from the date it's issued
    const expirationDate = cloneDeep(issuanceDate);
    expirationDate.setFullYear(
      issuanceDate.getFullYear() + 1,
      issuanceDate.getMonth(),
      issuanceDate.getDate()
    );

    // Create Verifiable Credential
    const data = {
      credential: {
        issuer: {
          id: process.env.INTORI_AGENT_ISSUER_DID,
        },
        credentialSubject: {
          loginName: req.body.loginName,
          id: req.body.identifier,
        },
        type: ['SiteLoginCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        issuanceDate: issuanceDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
      },
      proofFormat: 'jwt',
    };

    const ret = await axios({
      method: 'post',
      url: `${process.env.INTORI_AGENT_URL}/agent/createVerifiableCredential`,
      headers: intoriAgentHeaders,
      data: data,
    });

    verifiableCredential = ret.data;
    console.log('Credential: ', JSON.stringify(verifiableCredential));

    // Save Verifiable Credential
    const dataSave = {
      verifiableCredential,
    };
    await axios({
      method: 'post',
      url: `${process.env.INTORI_AGENT_URL}/agent/dataStoreSaveVerifiableCredential`,
      headers: intoriAgentHeaders,
      data: dataSave,
    });
  } else {
    const agent = await getAgent();
    const identifier = await agent.didManagerCreate({
      kms: 'local',
      provider: 'did:pkh',
      options: { network: 'eip155', chainId: '1' },
    });
    verifiableCredential = await agent.createVerifiableCredential({
      proofFormat: 'jwt',
      credential: {
        credentialSubject: {
          id: req.body.identifier,
          loginName: req.body.loginName,
        },
        type: ['SiteLoginCredential'],
        issuer: {
          id: identifier.did,
        },
      },
    });
  }

  res.json(verifiableCredential);
});

router.post('/challenge', async (req, res) => {
  console.log(`did:${JSON.stringify(req.body.did)}`);
  const nonce = crypto.randomBytes(16).toString('base64');

  // set nounce on cache with ttl = 60s
  cache.set(req.body.did as string, nonce, 60);
  res.json({
    challenge: nonce,
  });
});

router.post('/signIn', async (req, res) => {
  console.log(`presentation:${JSON.stringify(req.body.presentation)}`);

  const intoriAgentHeaders = {
    accept: 'application/json; charset=utf-8',
    Authorization: `Bearer ${process.env.INTORI_AGENT_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const verifiablePresentation: VerifiablePresentation = req.body
    .presentation as VerifiablePresentation;

  let verified = false;
  if (process.env.INTORI_AGENT_USE) {
    const dataPresentation = {
      presentation: {
        ...req.body.presentation,
      },
    };

    const retPresentation = await axios({
      method: 'post',
      url: `${process.env.INTORI_AGENT_URL}/agent/verifyPresentation`,
      headers: intoriAgentHeaders,
      data: dataPresentation,
    });

    verified = retPresentation.data.verified;
  } else {
    const agent = await getAgent();

    // check challenge
    const a: any = jwt_decode(verifiablePresentation.proof.jwt);
    const did = a.iss;
    const cachedNonce = cache.get(did);

    if (
      cachedNonce === undefined ||
      cachedNonce !== verifiablePresentation.nonce
    ) {
      res.json({ verified: false, message: 'Invalid Nonce' });
    }

    // We verify the presentation is signed by the user
    const result = await agent.verifyPresentation({
      presentation: verifiablePresentation,
    });
    verified = result.verified;
  }

  if (verified) {
    const credential: VerifiableCredential =
      verifiablePresentation.verifiableCredential?.pop() as VerifiableCredential;
    if (!credential.type?.includes('SiteLoginCredential')) {
      res.json({
        verified: false,
        message:
          'Invalid Credential: we are expecting a credential with type SiteLoginCredential',
      });
    }

    let verificationResponse = null;
    try {
      if (process.env.INTORI_AGENT_USE) {
        const dataCredential = {
          credential,
        };
        const retCredential = await axios({
          method: 'post',
          url: `${process.env.INTORI_AGENT_URL}/agent/verifyCredential`,
          headers: intoriAgentHeaders,
          data: dataCredential,
        });
        verificationResponse = retCredential.data;
        console.log(verificationResponse?.error);
      } else {
        const agent = await getAgent();
        verificationResponse = await agent.verifyCredential({ credential });
        console.log(verificationResponse.error?.message);
      }
    } catch (e) {
      res.sendStatus(500).json({ verified: false, message: e });
    }

    if (!verificationResponse?.verified) {
      res.json({
        verified: false,
        message: `Invalid Credential: ${verificationResponse?.error}`,
      });
    } else {
      res.json({ verified: true });
    }
  }
});

export default router;
