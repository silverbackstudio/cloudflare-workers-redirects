import React, { useState, useEffect, useContext } from 'react';
import ConfigContext from './ConfigContext';
import fetchApi from './fetchApi';

function ConfigForm(props) {

  const { onSubmit } = props;

  const config = useContext(ConfigContext);

  const [namespaces, setNamespaces] = useState([]);

  useEffect(() => {
    
    if ( !config.cfAccount || !config.cfEmail || !config.cfKey ) {
      return;
    }
    
    fetchApi(`namespaces`, { method: "GET",  headers : { 'Content-Type': 'application/json' } }, config)
      .then( response => response.json() )
      .then( response => {

        if ( response.success ){
          setNamespaces( response.result );
        }
        
        if ( response.error ){
          throw Error( response.error, '' );
        }

        if ( response.errors && response.errors.length > 0 ){
          throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}`, '' ));
        }
      })
      .catch((err) => {
        console.error('ERROR IN FETCH NAMESPACES', err);
      });

  }, [config]); // Only re-run the effect if count changes

  return (
      <form id="cloudflare" onSubmit={ onSubmit }>
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
        <label>
          Cloudflare Namespace ID      
          <input type="text" name="cfNamespace" defaultValue={config.cfNamespace} />
        </label>         
        { namespaces && (
        <label>
          Namespace    
          <select name="cfNamespace"  >
            { namespaces.map( (namespace) => (<option value={ namespace.id } key={namespace.id} >{namespace.title}</option>) ) }
          </select>          
        </label>       
        )}
        <button type="submit" >Save</button>                 
      </form>
  );
}

export default ConfigForm;
