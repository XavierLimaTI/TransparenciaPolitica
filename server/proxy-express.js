// Deprecated duplicate of server/proxy.js
// Keep this small file as a pointer for developers who might look for an "Express" proxy variant.
// The canonical, maintained Express proxy is `server/proxy.js`.

module.exports = function deprecatedProxyExpress() {
  console.warn('server/proxy-express.js is deprecated. Use server/proxy.js (npm run start-proxy) or server/proxy-light.js for a lightweight alternative.');
};
