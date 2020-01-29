import React, { useState, useContext, useEffect } from 'react';
import fetchApi from '../lib/cloudflareRedirects';
import ConfigContext from './ConfigContext';
import { Button, Card, Accordion, Badge, Spinner } from 'react-bootstrap';
import calculateHash from '../lib/hash';
import { Form, Container, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';

export const emptyRedirect = { 
  match: '', 
  destination: '',
  type: 301,
}

function Redirect(props) {

  const config = useContext(ConfigContext);

  const {
    onDelete,
    onSave,
    isPreset = false,
  } = props;

  const [redirectId, setRedirectId] = useState(props.redirectId || null);
  const [redirect, setRedirect] = useState(emptyRedirect);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {

    if (!redirectId) {
      return;
    }

    setLoading(true);

    fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "GET",
      headers: { 'Content-Type': 'application/json' },
      cache: "force-cache"
    }, config)
      .then(response => response.json())
      .then(response => {

        setLoading(false);

        if (response.success === false && response.errors.find(error => error.code === 10009)) {
          return;
        } else if (response.error) {
          throw Error(response.error, '');
        } else if (response.errors) {
          throw Error(response.errors.reduce((errorString, error) => `${errorString} ${error.message}`, ''));
        }

        setRedirect(response);
      })
      .catch((err) => {
        console.error('ERROR IN FETCH REDIRECT', err);
        setError(err);
      });

  }, [config, redirectId]);

  useEffect(() => {

    if (!props.redirect || !props.redirect.match) {
      return;
    }

    setRedirect(props.redirect);

    const updateRedirect = async () => {
      let redirectHash = await calculateHash(props.redirect.match);
      setRedirectId(redirectHash);
    }

    updateRedirect();

  }, [props.redirect]);

  const handleInputChange = (event) => {
    const target = event.target;
    const value =
      target.type === 'checkbox'
        ? target.checked
        : target.value;
    const name = target.id;
    setDirty(true);
    setRedirect(Object.assign({}, redirect, { [name]: value }));
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if ( onSave ) {
      onSave(redirect)
        .then(() =>{
          setDirty(false);
        })
    }
  }

  const protocol = /https?:\/\//gi;

  const isInfinite = (redirect.match && redirect.destination) && (redirect.match === redirect.destination);
  const isMaybeInfinite = (redirect.match && redirect.destination) && (redirect.match.replace(protocol, '') === redirect.destination.replace(protocol, ''));

  const isValid = redirect.match && redirect.destination && !isInfinite;

  return (
    <Card>
      <Accordion.Toggle as={Card.Header} variant="link" eventKey={redirectId}>
        {redirect.match ? `${redirect.match}` : 'New Redirect'}
        {redirect.match && (<a target="_blank" rel="noopener noreferrer" href={redirect.match} > =></a>)}    

        {loading && ( <Spinner className="float-right" animation="border" role="status"/> ) }

        { isInfinite && (<Badge className="float-right" variant="danger">Infinite</Badge> )}    
        { !isInfinite && isMaybeInfinite && (<Badge className="float-right" variant="warning">Maybe Infinite</Badge> )}    
        {error && (<Badge className="float-right" variant="error">Error</Badge> )}    
        {dirty && (<Badge className="float-right" variant="info">Unsaved</Badge> )}    
        {redirect.destination && (<Badge className="float-right" variant="success">Redirected</Badge> )}    
      </Accordion.Toggle>
      <Accordion.Collapse eventKey={redirectId}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Container>
              <Row>
                <Col>
                  <Form.Group controlId="match">
                    <Form.Label>Match</Form.Label>
                    <Form.Control type="text" value={redirect.match} onChange={handleInputChange} disabled={isPreset} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="destination">
                    <Form.Label>Destination</Form.Label>
                    <Form.Control type="text" value={redirect.destination} onChange={handleInputChange} />
                  </Form.Group>
                </Col>
              </Row>
            </Container>
            { redirect.destination && (<Button data-id={redirectId}  onClick={ () => onDelete(redirectId) } variant="danger">Clear</Button>)}
            <Button variant="success" type="submit" className="float-right" disabled={ !isValid } >Save</Button>
          </Form>
        </Card.Body>
      </Accordion.Collapse>
    </Card>
  );
}

export default Redirect;
