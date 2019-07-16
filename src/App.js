import React, { useState, useEffect } from 'react';
import './App.css';


function App() {

  const [config, setConfig] = useState({
    cfKey: '',
    cfEmail: '',
    cfAccount: '',
    cfNamespace: ''
  });

  const [namespaces, setNamespaces] = useState([]);

  const [redirect, setRedirect] = useState({
    match: '',
    destination: '',
  });  

  const [redirects, setRedirects] = useState();  

  const updateRedirects = () => {

    fetch(`http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/namespaces/${config.cfNamespace}/values/index`, {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Email' : config.cfEmail,
        'X-Auth-Key': config.cfKey
      }
    })
    .then( response => response.json() )
    .then( response => {

      console.log( 'GET REDIRECT INDEX', response );

      if ( response.success === false ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }

      let redirects = new Map( response );

      setRedirects( redirects );
    })
    .catch((err) => {
      console.error('ERROR IN FETCH INDEX', err);
    });

  }

  useEffect(() => {
    
    if ( !config.cfAccount || !config.cfEmail || !config.cfKey ) {
      return;
    }

    if ( config.cfNamespace ) {
      updateRedirects();
    }    
    
    fetch(`http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/namespaces/`, {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Email' : config.cfEmail,
        'X-Auth-Key': config.cfKey
      }
    })
    .then( response => response.json() )
    .then( response => {
      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }
      setNamespaces( response.result );
    })
    .catch((err) => {
      console.error('ERROR IN FETCH NAMESPACES', err);
    });

  }, [config]); // Only re-run the effect if count changes


  const onSaveConfig = ( htmlEvent ) => {
    htmlEvent.preventDefault(); 
    const formData = new FormData(htmlEvent.target);
    let config = Object.fromEntries(formData);
    console.log('save config', config);    
    setConfig( config ); 
  }

  const onAddRedirect = (htmlEvent) => {

    htmlEvent.preventDefault(); 

    const redirectId = btoa(redirect.match);

    return fetch(`http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "PUT",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Email' : config.cfEmail,
        'X-Auth-Key': config.cfKey
      },      
      body: redirect.destination
    })
    .then( response => response.json() )
    .then( response => {

      console.log( 'REDIRECT SAVE RESPONSE', response );

      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }

      console.log( 'REDIRECT SAVE SUCCESS' );

      let redirectId = btoa(redirect.match);

      redirects.set(redirectId, redirect);

      console.log( 'SAVING REDIRECTS INDEX', redirects  );

      let indexRequest = fetch(`http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/namespaces/${config.cfNamespace}/values/index`, {
        method: "PUT",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Auth-Email' : config.cfEmail,
          'X-Auth-Key': config.cfKey
        },
        body: JSON.stringify( Array.from( redirects.entries() ) )
      });

      setRedirect({ match: '', destination: '' });

      return indexRequest;

    })
    .then( response => response.json() )
    .then( response => {

      console.log('REDIRECT INDEX SAVE', response);

      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }

      updateRedirects();

    } )
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

    return fetch(`http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "DELETE",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Email' : config.cfEmail,
        'X-Auth-Key': config.cfKey
      }
    })
    .then( response => response.json() )
    .then( response => {

      if ( ! response.success ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }

      console.log('REDIRECT DELETED', redirectId);

      redirects.delete(redirectId);

      console.log('UPDATING REDIRECT INDEX', redirectId);

      return fetch(`http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/namespaces/${config.cfNamespace}/values/index`, {
        method: "PUT",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Auth-Email' : config.cfEmail,
          'X-Auth-Key': config.cfKey
        },
        body: JSON.stringify( Array.from( redirects.entries() ) )
      })
    })
    .then( response => {

      if ( response.success === false ){
        throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}` ), '' );
      }

      updateRedirects();

      console.log('REDIRECT INDEX UPDATED', redirects);

    })    
    .catch(err => {
      console.error('ERROR DELETING REDIRECT', err);
    })    

  }


  return (
    <div className="App">
      <header className="App-header">
        <h1>SVBK Redirect Manager</h1>
      </header>
      <h2>Cloudflare</h2>
      <form id="cloudflare" onSubmit={ onSaveConfig }>
        <label>
          Cloudflare API Key
          <input type="text" name="cfKey" defaultValue={config.cfKey} />
        </label>
        <label>
          Cloudflare Email     
          <input type="text" name="cfEmail" defaultValue={config.cfEmail}/>
        </label>        
        <label>
          Cloudflare Account ID      
          <input type="text" name="cfAccount" defaultValue={config.cfAccount} />
        </label> 
        { namespaces && (
        <label>
          Namespace    
          <select name="cfNamespace"  >
            { namespaces.map( (namespace) => (<option value={ namespace.id }>{namespace.title}</option>) ) }
          </select>          
        </label>       
        )}
        <button type="submit" >Save</button>                 
      </form>
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
            { Array.from(redirects.entries()).map( ([redirectId, redirect]) => (
              <tr className="redirect" key={redirectId} >
                <td className="redirect__match">{redirect.match}</td>
                <td className="redirect__dest">{redirect.destination}</td>
                <td>
                  <button className="redirect__delete" data-id={redirectId} onClick={ onRedirectDelete }>Delete</button>
                </td>
              </tr>
            ) ) }
            </tbody>
          </table>
        </div>
      )} 
    </div>
  );
}

export default App;
