import React, { useState, useEffect, useCallback } from 'react';
import Redirect from './Redirect';
import ConfigForm from './ConfigForm';
import ConfigContext from './ConfigContext';
import fetchApi from './fetchApi';

import './App.css';

function App() {

  const [config, setConfig ] = useState({
    cfKey: '',
    cfEmail: '',
    cfAccount: '',
    cfNamespace: ''
  });

  const [redirect, setRedirect] = useState({
    match: '',
    destination: '',
  });  

  const [redirects, setRedirects] = useState();  

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

    fetchApi(`/namespaces/${config.cfNamespace}/keys`, { method: "GET" }, config)
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

  const onAddRedirect = (htmlEvent) => {

    htmlEvent.preventDefault(); 

    const redirectId = btoa(redirect.match);

    return fetchApi(`/namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "PUT",     
      body: redirect.destination
    }, config)
    .then( response => response.json() )
    .then( response => {

      console.log( 'REDIRECT SAVE RESPONSE', response );

      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}`, '' ) );
      }

      console.log( 'REDIRECT SAVE SUCCESS' );

      let redirectId = btoa(redirect.match);
      redirects.add(redirectId);

      setRedirect({ match: '', destination: '' });
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

    return fetchApi(`/namespaces/${config.cfNamespace}/values/${redirectId}`, {
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
      { redirects && (
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
            { Array.from(redirects.values()).map( redirectId => (<Redirect redirectId={redirectId} key={redirectId} onDelete={onRedirectDelete} />) ) }
            </tbody>
          </table>
        </div>
      )} 
      <footer>by Silverback Studio - <a href="https://github.com/silverbackstudio/cfw-redirects">GitHub repo</a></footer>
    </div>
    </ConfigContext.Provider>
  );
}

export default App;
