import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Proxy received request');
    res.status(200).json({ message: "Proxy is working!" });
    return;
  } catch (error: any) {
    console.error('Proxy server error:', error);
    res.status(500).json({ error: "A server error has occurred" });
    return;
  }
}
