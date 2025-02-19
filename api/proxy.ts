import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers (for testing - REMOVE IN PRODUCTION)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('Proxy received request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  });

  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL; // Get the URL from an environment variable

    if (!n8nWebhookUrl) {
      throw new Error("N8N_WEBHOOK_URL environment variable not set!");
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    console.log('n8n response:', { status: response.status, headers: response.headers });

    if (!response.ok) {
      const errorBody = await response.text(); // Read the error body as text
      console.error('n8n error body:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const data = await response.json();
    console.log('n8n response data:', data);
    res.status(200).json(data); // Send a 200 OK response with the data
    return;

  } catch (error: any) {
    console.error('Detailed proxy server error:', error);
    console.error('Error stack trace:', error.stack);
    res.status(500).json({ error: error.message });
    return;
  }
}
