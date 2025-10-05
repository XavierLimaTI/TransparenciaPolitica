// Export plain config object to avoid requiring '@playwright/test' at module load time
module.exports = {
  use: { baseURL: 'http://localhost:8000' },
  webServer: {
    command: 'npx http-server -c-1 -p 8000',
    port: 8000,
    reuseExistingServer: true,
  },
};
