const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Configuration dynamique selon l'environnement
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalDev = process.env.REACT_APP_USE_LOCAL_API === 'true' || isDevelopment;
  
  // Choisir la target selon l'environnement
  const target = isLocalDev ? 'http://localhost:8080' : 'https://investmali.abdatytch.com';
  const secure = !isLocalDev; // false pour localhost, true pour HTTPS
  
  console.log(`🔧 setupProxy.js: Configuration proxy - Environnement: ${process.env.NODE_ENV}`);
  console.log(`🎯 Target: ${target} (Local: ${isLocalDev})`);
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      secure: secure,
      onProxyReq: (proxyReq, req, res) => {
        // Log des requêtes pour le débogage
        console.log(`Proxying request: ${req.method} ${req.url} → ${target}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Erreur de connexion au serveur' });
      },
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '/api', // Conserve le préfixe /api
      },
    })
  );
};
