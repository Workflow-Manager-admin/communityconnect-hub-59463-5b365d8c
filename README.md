# communityconnect-hub-59463-5b365d8c

## News API Backend Proxy

To keep your News API key secure, start the backend proxy before launching the React frontend:

1. Install dependencies for the API server:
   ```
   cd communityconnect_hub
   npm install express node-fetch cors
   ```
2. Start the API server:
   ```
   node api-server.js
   ```
   By default, it runs on port 3300.

3. The frontend should be updated to fetch news from `/api/news` at `http://localhost:3300/api/news`.