var http = require('http')
var https = require('https')

const PROXY_PORT = 8010;
const PROXY_ADDRESS = '127.0.0.1';

const proxy = http.createServer( function(request, response){
    
    console.log( '%s %s', request.method, request.url);

    if ( request.method === 'OPTIONS' ) {
        response.writeHead(200, { 
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization, Content-Type',
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

    if ( request.headers['authorization'] ) {
        request_options.headers['authorization'] = request.headers['authorization'];
    }

    var proxy_request = https.request(request_options, function(proxy_response){
        proxy_response.pipe(response);
        proxy_response.headers['access-control-allow-origin'] = '*';

        response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });

    request.pipe(proxy_request);
});

proxy.listen(PROXY_PORT, PROXY_ADDRESS, function(){
    const address = proxy.address().address;
    const port = proxy.address().port;
    console.log(`Proxy started at http://${address}:${port}`);    
});