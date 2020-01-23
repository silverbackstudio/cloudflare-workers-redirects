import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

const newRedirect = {
  match: '',
  destination: '',
  type: 301
};

function RedirectForm(props) {

  const {
    onSubmit,
    disallowSubmit = true,
    defaultFields = newRedirect
  } = props;

  const [fields, setFields] = useState(defaultFields);

  const handleInputChange = (event) => {
    const target = event.target;
    const value =
      target.type === 'checkbox'
        ? target.checked
        : target.value;
    const name = target.id;

    setFields(Object.assign({}, fields, { [name]: value }));
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(fields)
    .then(() => {
      setFields(newRedirect);
    });
  }

  return (
    <Form id="add-redirect" onSubmit={handleSubmit}>
      <Form.Group controlId="match">
        <Form.Label>Match URL</Form.Label>
        <Form.Control type="text" value={fields.match} onChange={handleInputChange} />
      </Form.Group>
      <Form.Group controlId="destination">
        <Form.Label>Redirect URL </Form.Label>
        <Form.Control type="text" value={fields.destination} onChange={handleInputChange} />
      </Form.Group>
      <Button variant="success" type="submit" disabled={disallowSubmit} >Add</Button>
    </Form>
  );
}

export default RedirectForm;
