Local Portal proxy

Purpose
- A small local proxy (server/proxy.js) is provided to avoid exposing your Portal da Transparência API key in the browser. The proxy stores the key locally and injects it when forwarding `/despesas` requests to the official API.

Run the proxy (development)
- From the project root:

```powershell
# start without admin token (open /set-key endpoint)
node server/proxy.js

# or using npm script
npm run start-proxy:local

# or start with an admin token to protect /set-key
$env:PROXY_ADMIN_TOKEN='local-secret'; node server/proxy.js
```

Saving a key to the proxy
- From the browser: open the app UI, open the "Configurar chave" modal and click "Salvar na proxy local". If the proxy requires an admin token, paste it into the "Token admin para proxy (opcional)" field.

- From the command-line (node script) without admin token:

```powershell
node scripts/post-proxy-key.js "YOUR_REAL_KEY"
```

- With admin token (script argv):

```powershell
node scripts/post-proxy-key.js "YOUR_REAL_KEY" "local-secret"
```

Quick verification (one-liner)

```powershell
# runs probe -> set-key -> probe -> unset-key -> probe
npm run verify-proxy -- "SOME_KEY" "local-secret"
```

Persisted key
- The proxy writes the key to `server/portal_key.json` so it survives restarts. Do not commit this file if you use a real key.

Notes
- The proxy listens on port 3001 by default. If you change the port, update the client/config accordingly.
- This proxy is intended for local development only. Do not deploy it to a public server without adding proper authentication and secure storage.
