import serverless from 'serverless-http';
import { createApp } from '../../server/createApp';

const app = createApp();
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  try {
    const response = await serverlessHandler(event, context);
    return response;
  } catch (error: any) {
    console.error('[Netlify Function API Error]:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error?.message || 'Erreur interne du serveur Netlify',
      }),
    };
  }
};

