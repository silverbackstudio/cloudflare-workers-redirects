import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import CloudflareConfigForm from '../components/CloudflareConfigForm';
import CSEConfigForm from '../components/CSEConfigForm';

function PageConfig(props) {
  
  const { onSave } = props;

  return (
    <Container>
      <h1>Config</h1>
      <Row>
        <Col>
          <h2>Cloudflare</h2>
          <CloudflareConfigForm onSubmit={onSave} />
        </Col>
        <Col>
          <h2>Google Search</h2>
          <CSEConfigForm onSubmit={onSave} />
        </Col>
      </Row>
    </Container>
  );
}

export default PageConfig;
