var http = require('http')
var https = require('https')

const proxy = http.createServer( function(request, response){
    
    console.log( '%s %s', request.method, request.url);

    if ( request.method === 'OPTIONS' ) {
        console.log('CORS preflight request');
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

        proxy_response.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });

        response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });

    request.pipe(proxy_request);
});

proxy.listen(8010, '127.0.0.1', function(){
    const address = proxy.address().address;
    const port = proxy.address().port;
    console.log(`Server avviato all'indirizzo http://${address}:${port}`);    
});