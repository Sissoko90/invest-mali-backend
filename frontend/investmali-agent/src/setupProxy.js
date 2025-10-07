const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        // Log des requêtes pour le débogage
        console.log('Proxying request:', req.method, req.url);
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
