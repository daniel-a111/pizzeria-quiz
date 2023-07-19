

import bodyParser from 'body-parser';
import express from 'express';
import * as config from './config';
import { startPipeline } from './pizza/pipeline';
import routes from './routes';
import * as redis from './services/redis';

const app = express();
const port = 3000;
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb' }));
app.use(bodyParser.json());
app.use('/', routes);

// (async () => {
// })();

app.listen(port, async () => {
    await redis.startClient();
    await startPipeline(config.WORKERS);
    return console.log(`Express is listening at http://localhost:${port}`);
});
