import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Proxy received request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  });

  try {
    // TEMPORARILY REMOVE THE CALL TO THE N8N WORKFLOW
    // const response = await fetch('https://n8n.servenorobot.com/webhook/social-media-post', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //   },
    //   body: JSON.stringify(req.body)
    // });

    // console.log('n8n response:', { status: response.status, headers: response.headers });
    // if (!response.ok) {
    //   const errorBody = await response.json();
    //   console.error('n8n error body:', errorBody);
    //   throw new Error(`HTTP error! status: ${response.status}, body: ${JSON.stringify(errorBody)}`);
    // }

    // const data = await response.json();
    // console.log('n8n response data:', data);
    // res.json(data);

    // REPLACE WITH A STATIC RESPONSE
    console.log('Sending static response');
    res.status(200).json({ details: "This is a test response from the proxy!" });
    return; // Ensure the function returns after sending the response

  } catch (error: any) {
    console.error('Detailed proxy server error:', error);
    console.error('Error stack trace:', error.stack); // Log the stack trace
    res.status(500).json({ error: error.message });
    return; // Ensure the function returns after sending the error response
  }
}
