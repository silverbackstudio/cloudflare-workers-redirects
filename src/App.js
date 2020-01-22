import React, { useState, useEffect, useCallback } from 'react';
import Redirect from './Redirect';
import ConfigForm from './ConfigForm';
import ConfigContext from './ConfigContext';
import fetchApi from './fetchApi';

import './App.css';

async function calculateHash(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);           // hash the message  
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

const newRedirect = {
  match: '',
  destination: '',
  type: 301
}

const PAGE_SIZE = 25;

function App() {

  const [config, setConfig ] = useState({
    cfKey: '',
    cfEmail: '',
    cfAccount: '',
    cfNamespace: ''
  });

  const [redirect, setRedirect] = useState(newRedirect);  
  const [redirects, setRedirects] = useState( new Set() );  
  const [page, setPage] = useState(1);  

  const onSaveConfig = ( htmlEvent ) => {
    htmlEvent.preventDefault(); 
    const formData = new FormData(htmlEvent.target);
    let newConfig = Object.fromEntries(formData);
    setConfig( newConfig ); 
  }

  const fetchRedirects = useCallback(() => {

    if ( !config.cfAccount || !config.cfEmail || !config.cfKey ) {
      return;
    }

    fetchApi(`namespaces/${config.cfNamespace}/keys`, { method: "GET", headers : { 'Content-Type': 'application/json' } }, config)
    .then( response => response.json() )
    .then( response => {

      console.log( 'GET REDIRECT INDEX', response );

      if ( response.success === false ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }
    
      setRedirects( new Set(response.result.map( (item) => item.name )) );
    })
    .catch((err) => {
      console.error('ERROR IN FETCH INDEX', err);
    });

  }, [config]);

  useEffect(() => {
    
    if ( !config.cfAccount || !config.cfEmail || !config.cfKey ) {
      return;
    }

    if ( config.cfNamespace ) {
      fetchRedirects();
    }    
    
  }, [config, fetchRedirects]); // Only re-run the effect if count changes

  const onAddRedirect = async (htmlEvent) => {

    htmlEvent.preventDefault(); 

    const redirectId = await calculateHash(redirect.match);

    return fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "PUT",     
      body: JSON.stringify(redirect)
    }, config)
    .then( response => response.json() )
    .then( response => {

      console.log( 'REDIRECT SAVE RESPONSE', response );

      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}`, '' ) );
      }

      console.log( 'REDIRECT SAVE SUCCESS' );

      redirects.add(redirectId);

      setRedirect(newRedirect);
      setRedirects(redirects);
    })
    .catch(err => {
      console.error('ERROR SAVING REDIRECT', err);
    })

  }

  const onRedirectDelete = ( htmlEvent ) => {

    const redirectId = htmlEvent.target.getAttribute('data-id');

    if( !window.confirm('Are you sure you wish to delete this item?')){
      return;
    }

    console.log( 'DELETE REDIRECT', redirectId );

    return fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "DELETE",
    }, config)
    .then( response => response.json() )
    .then( response => {

      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }

      redirects.delete(redirectId);
      setRedirects(redirects);

      console.log('REDIRECT DELETED', redirectId);
    })
    .catch(err => {
      console.error('ERROR DELETING REDIRECT', err);
    })    

  }

  const pages = Math.floor( redirects.size / PAGE_SIZE );


  return (
    <ConfigContext.Provider value={config}>
    <div className="App">
      <header className="App-header">
        <h1>Cloudflare Workers Redirect Manager</h1>
      </header>
      <h2>Cloudflare</h2>
      <ConfigForm onSubmit={onSaveConfig} />
      { config.cfNamespace && (
        <div>
        <h2>Add Redirect</h2>
        <form onSubmit={ onAddRedirect } >
          <label>
            Match URL
            <input type="text" name="match_url" value={redirect.match} onChange={ (event) => { setRedirect( { ...redirect, match:event.target.value } ) } } />
          </label>
          <label>
            Redirect URL        
            <input type="text" name="redirect_url" value={redirect.destination} onChange={ (event) => { setRedirect( { ...redirect, destination:event.target.value } ) } } />
          </label>
          <button type="submit" >Aggiungi</button>
        </form>     
        </div>
      )} 
      { redirects.size > 0 && (
        <div id="redirects">
          <h2>Existing Redirects</h2>          
          <table>
            <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
            </tr>
            </thead>
            <tbody>
            { Array.from(redirects.values()).slice( PAGE_SIZE * (page - 1), PAGE_SIZE * page).map( redirectId => (<Redirect redirectId={redirectId} key={redirectId} onDelete={onRedirectDelete} />) ) }
            </tbody>
          </table>
          { (page < pages ) && (<button onClick={ () => setPage(page+1) } >Next Page</button>) }
          { (page <= 1 ) && (<button onClick={ () => setPage(page-1) } >Prev Page</button>) }
        </div>
      )} 
      <footer>by Silverback Studio - <a href="https://github.com/silverbackstudio/cfw-redirects">GitHub repo</a></footer>
    </div>
    </ConfigContext.Provider>
  );
}

export default App;
