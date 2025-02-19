
#!/bin/bash
# Start the proxy server
npx ts-node src/server/proxy.ts &
# Start the development server
npm run dev
