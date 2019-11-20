import React, { useState, useContext, useCallback } from 'react';
import fetchApi from './fetchApi';
import ConfigContext from './ConfigContext';

function Redirect(props) {

  const config = useContext(ConfigContext);

  const {
     redirectId,
     onDelete
  } = props;

  const [redirect, setRedirect] = useState(null);

  const loadDetails = useCallback(() => {    
      fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
        method: "GET",
        headers : { 'Content-Type': 'application/json' }
      }, config)
      .then( response => response.text() )
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
      });
  }, [config, redirectId]);

  let match;

  try{
    match = atob(redirectId);
  } catch(e) {
    console.error('Unable to decode', redirectId, e);
    return (<></>);
  }

  return (
    <tr className="redirect" key={redirectId} >
      <td className="redirect__match">{match}</td>
      <td className="redirect__dest">
        {redirect ? (redirect) : (<button onClick={ loadDetails }>Show destination</button>) }
      </td>
      <td>
        <button className="redirect__delete" data-id={redirectId} onClick={ onDelete }>Delete</button>
      </td>
    </tr>
  );
}

export default Redirect;
