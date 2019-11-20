const functions = require('firebase-functions');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer(); 

exports.cloudflareApiProxy = functions.https.onRequest((req, res) => {
    console.log( 'REQUEST: %s %s', req.method, res.url);
    proxy.web(req, res, { target: 'https://api.cloudflare.com', changeOrigin: true });
});
