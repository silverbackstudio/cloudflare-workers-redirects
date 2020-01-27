import React, { useState, useContext, useEffect } from 'react';
import fetchApi from '../lib/fetchApi';
import ConfigContext from './cloudflare/ConfigContext';
import { Button } from 'react-bootstrap';

function Redirect(props) {

  const config = useContext(ConfigContext);

  const {
     redirectId,
     onDelete
  } = props;

  const [redirect, setRedirect] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {    
      fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
        method: "GET",
        headers : { 'Content-Type': 'application/json' },
        cache: "force-cache"
      }, config)
      .then( response => response.json() )
      .then( response => {

        if ( response.error ){
          throw Error( response.error, '' );
        }

        if ( response.errors ){
          throw Error( response.errors.reduce( (errorString, error) => `${errorString} ${error.message}`, '' ));
        }

        setRedirect(response);
      })
      .catch((err) => {
        console.error('ERROR IN FETCH REDIRECT', err);
        setError(err);
      });
  }, [config, redirectId]);


  if ( error ) {
    return (
      <tr className="redirect" key={redirectId} >
        <td className="redirect__error" colSpan="3">Error: {error.message}</td>
      </tr>
    );
  }

  if ( !redirect ) {
    return (
      <tr className="redirect" key={redirectId} >
        <td className="redirect__placeholder" colSpan="3">Loading..</td>
      </tr>
    );
  }

  return (
    <tr className="redirect" key={redirectId} >
      <td className="redirect__match">{redirect.match}</td>
      <td className="redirect__dest">
        {redirect.destination}
      </td>
      <td>
        <Button className="redirect__delete" data-id={redirectId} onClick={ onDelete } variant="danger">Delete</Button>
      </td>
    </tr>
  );
}

export default Redirect;
