
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Proxy received request body:', req.body);
    
    const response = await fetch('https://n8n.servenorobot.com/webhook/social-media-post', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body),
    });

    console.log('n8n response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('n8n response data:', data);
    res.json(data);
  } catch (error) {
    console.error('Detailed proxy server error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
