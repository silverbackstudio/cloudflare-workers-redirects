const functions = require('firebase-functions');
const https = require('https');

exports.cfwRedirectsProxy = functions.https.onRequest((request, response) => {
    console.log( '%s %s', request.method, request.url);

    if ( request.method === 'OPTIONS' ) {
        response.writeHead(200, { 
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'X-Auth-Key, X-Auth-Email, Content-Type',
            'access-control-allow-methods': 'GET, POST, PUT, DELETE'
        });
        response.end();
        return;
    }

    var request_options = {
        host: 'api.cloudflare.com',
        port: 443,
        path: request.url,
        method: request.method,
        headers: { 
            'Content-Type': 'application/json',
        }
    };

    if ( request.headers['x-auth-key'] ) {
        request_options.headers['x-auth-key'] = request.headers['x-auth-key'];
    }

    if ( request.headers['x-auth-email'] ) {
        request_options.headers['x-auth-email'] = request.headers['x-auth-email'];
    }    

    var proxy_request = https.request(request_options, function(proxy_response){
        proxy_response.pipe(response);
        proxy_response.headers['access-control-allow-origin'] = '*';

        response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });

    request.pipe(proxy_request);
});
