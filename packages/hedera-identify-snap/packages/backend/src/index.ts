import app from './app';

import { setupAgent, getAgent } from './veramo/setup';

const port = process.env.PORT || 5000;
app.listen(port, async () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
