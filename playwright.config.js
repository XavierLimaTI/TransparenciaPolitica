// Export plain config object to avoid requiring '@playwright/test' at module load time
module.exports = {
  use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:8000' },
  webServer: {
    command: 'npx http-server -c-1 -p 8000',
    port: 8000,
    reuseExistingServer: true,
  },
};
