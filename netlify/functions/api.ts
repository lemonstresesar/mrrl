import serverless from 'serverless-http';
import { createApp } from '../../server/createApp';

const app = createApp();

export const handler = serverless(app);
