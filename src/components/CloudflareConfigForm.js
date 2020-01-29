import React, { useState, useEffect, useContext } from 'react';
import ConfigContext from './ConfigContext';
import fetchApi from '../lib/cloudflareRedirects';
import { Form, Button } from 'react-bootstrap';

function CloudflareConfigForm(props) {

  const { onSubmit } = props;

  const [namespaces, setNamespaces] = useState([]);
  const [config, setConfig] = useState(useContext(ConfigContext));

  const handleInputChange = (event) => {
    const target = event.target;
    const value =
      target.type === 'checkbox'
        ? target.checked
        : target.value;
    const name = target.id;

    setConfig( Object.assign({}, config, { [name]: value }) );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(config);
  }

  useEffect(() => {
    
    if ( !config.cfAccount || !config.cfKey ) {
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
      <Form id="authentication" onSubmit={ handleSubmit }>
        <Form.Group controlId="cfKey">
          <Form.Label>Cloudflare API Token</Form.Label>
          <Form.Control type="text" defaultValue={config.cfKey} onChange={handleInputChange} />
        </Form.Group>        
        <Form.Group controlId="cfAccount">
          <Form.Label>Cloudflare Account ID</Form.Label>
          <Form.Control type="text" defaultValue={config.cfAccount} onChange={handleInputChange} />
        </Form.Group>                         
        <Form.Group controlId="cfNamespace">
          <Form.Label>Cloudflare Namespace ID</Form.Label>
          <Form.Control type="text" defaultValue={config.cfNamespace} onChange={handleInputChange} />
          { namespaces && (
          <Form.Control type="text" defaultValue={config.cfNamespace} as="select" onChange={handleInputChange}>
            { namespaces.map( (namespace) => (<option value={ namespace.id } key={namespace.id} >{namespace.title}</option>) ) }
          </Form.Control>
          )}
        </Form.Group>                   
        <Button variant="primary" type="submit">
          Save
        </Button>        
      </Form>
  );
}

export default CloudflareConfigForm;
