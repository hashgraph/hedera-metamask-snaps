# Credential Issuer Backend Service

```
cp .env.example .env.development
```

Set `INTORI_AGENT_USE` to false if you would like to use the local Veramo agent. If you have set `INTORI_AGENT_USE` to true, make sure to also pass in the values for

- `INTORI_AGENT_URL`
- `INTORI_AGENT_API_KEY`
- `INTORI_AGENT_ISSUER_DID`

## Setup

```
npm install
```

## Lint

```
npm run lint
```

## Test

```
npm run test
```

## Development

```
npm run dev
```
