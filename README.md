# Cloudflare Workers Redirect Manager

Store redirect entries (ex. `source_url -> dest_url`) in [Cloudflare KV](https://www.cloudflare.com/products/workers-kv/) and use them in [Cloudflare Workers](https://www.cloudflare.com/it-it/products/cloudflare-workers/) to apply redirects at CDN level.

For each redirect the app encodes source url, by now using `base64` to keep things fast and simple, and uses it as key for the KV. The destination URL is saved as KV value.

## Cloudflare API Proxy
Becouse this is a full React app, there is no backend that does the logic. In order to comunicate with the Cloudflare REST API, without beeing blocked by the browser's CORS policy, we need to proxy the requests. This app provides a small NodeJS proxy that does exactly this job.

To start the proxy run:

```bash
npm run proxy
```

The proxy runs by default at port `8010`.

## Worker Setup

### Create namespace

1. Open the Cloudflare dash
2. In the main drop-down menu (domain selector), select `Workers` and click the `KV` tab.
3. Create new namespace and give it a name (ex. `Redirects`)

### Worker Script

Create a new script with this code:

```js
addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request))
})

async function fetchAndApply(request) {
  
    let url = new URL(request.url); 

    // Remove url parameters, not supported yet
    url.search = '';

    // Encode URL (without parameters) in base64
    let url_hash = btoa(url.href);

    // Try to find a corresponding redirect entry
    let redirect = await REDIRECTS.get(url_hash);

    // If corresponding redirect exists...
    if ( redirect ) {
        // ... return a HTTP 301 response.
        return new Response(null, { 
            'status' : 301 , 
            'headers' : { 
                'Location': redirect, 
                'X-Redirect-By': 'CF-W' 
                } 
            });
    }

    // Proxy the original request
    return await fetch(request);
}

```

### Cloudflare KV namespace binding

1. In the worker script editor, click on the KV tab
2. Click on `Add Binding` tab
3. Select the namespace created before and use `REDIRECTS` as variable name

### Add Worker route 

1. Select your website domain
2. Click on the `Workers` icon in the site menu
3. Click `Add Route` and type your website domain

Rember to add all possible worker routes for your website:

```
example.com/*
www.example.com/*
```


## Development

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

