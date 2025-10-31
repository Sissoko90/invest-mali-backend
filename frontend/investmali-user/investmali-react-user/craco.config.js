const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Configuration pour résoudre les modules Node.js dans le navigateur
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "url": require.resolve("url")
      };

      return webpackConfig;
    }
  },
  devServer: {
    // Configuration du serveur de développement
    port: 3000,
    host: 'localhost',
    // Correction pour l'erreur allowedHosts
    allowedHosts: ['localhost', '127.0.0.1'],
    // Configuration CORS et proxy
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    // Désactiver la vérification de l'hôte pour éviter les erreurs
    disableHostCheck: true,
    // Configuration pour le hot reload
    hot: true,
    // Configuration pour servir les fichiers statiques
    static: {
      directory: path.join(__dirname, 'public'),
    },
    // Configuration pour l'historique du routeur
    historyApiFallback: true,
    // Désactiver les overlays d'erreur intrusifs
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // Ajout des plugins pour les polyfills Node.js
          const webpack = require('webpack');
          webpackConfig.plugins.push(
            new webpack.ProvidePlugin({
              Buffer: ['buffer', 'Buffer'],
              process: 'process/browser',
            })
          );
          return webpackConfig;
        }
      }
    }
  ]
};
