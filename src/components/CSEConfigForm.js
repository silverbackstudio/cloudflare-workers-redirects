import React, { useState, useContext } from 'react';
import ConfigContext from './ConfigContext';
import { Form, Button } from 'react-bootstrap';

function CSEConfigForm(props) {

  const { onSubmit } = props;
  const [config, setConfig] = useState( useContext(ConfigContext) );

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
    if ( onSubmit ){
      onSubmit(config);
    }
  }

  return (
      <Form id="cse" onSubmit={ handleSubmit }>
        <Form.Group controlId="cseKey">
          <Form.Label>API Key</Form.Label>
          <Form.Control type="text" defaultValue={config.cseKey} onChange={handleInputChange} />
        </Form.Group>        
        <Form.Group controlId="cseId">
          <Form.Label>Engine ID</Form.Label>
          <Form.Control type="text" defaultValue={config.cseId} onChange={handleInputChange} />
        </Form.Group>                                         
        <Button variant="primary" type="submit" disabled={ !config.cseKey || ! config.cseId }>
          Save
        </Button>        
      </Form>
  );
}

export default CSEConfigForm;
