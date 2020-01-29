const functions = require('firebase-functions');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();


//restream parsed body before proxying
proxy.on('proxyReq', function (proxyReq, req, res, options) {
    if (!req.body || !Object.keys(req.body).length) {
        return;
    }

    var contentType = proxyReq.getHeader('Content-Type');
    var bodyData;

    if (contentType === 'application/json') {
        bodyData = JSON.stringify(req.body);
    }

    if (bodyData) {
        //proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
});

exports.cloudflareApiProxy = functions.https.onRequest((req, res) => {
    proxy.web(req, res, { target: 'https://api.cloudflare.com', changeOrigin: true });
});
