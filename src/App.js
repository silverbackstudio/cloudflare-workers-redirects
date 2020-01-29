import React, { useState } from 'react';
import ConfigContext from './components/ConfigContext';
import calculateHash from './lib/hash';
import { Row, Container, Col } from 'react-bootstrap';
import fetchApi from './lib/cloudflareRedirects';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import PageConfig from './pages/config';
import PageExisting from './pages/existing';
import PageGoogleSearch from './pages/google';
import { withCookies, useCookies } from 'react-cookie';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppNavbar from './components/AppNavbar';

function App() {

  const [cookies, setCookie ] = useCookies(['redirectConfig']);

  const [config, setConfig] = useState(Object.assign({
    cfKey: '',
    cfAccount: '',
    cfNamespace: ''
  }, cookies.redirectConfig));


  const onSaveConfig = (newConfig) => {
    let updatedConfig = Object.assign({}, config, newConfig);
    
    setCookie('redirectConfig', updatedConfig);
    setConfig(updatedConfig);
  }

  const onSaveRedirect = async (redirect) => {

    if (!redirect.match || !redirect.destination) {
      console.error('Missing redirect informations', redirect);
      return;
    }

    const redirectId = await calculateHash(redirect.match);

    console.log('CREATE NEW REDIRECT %s with id: %s', redirect, redirectId);

    return fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "PUT",
      headers : { 'Content-Type': 'application/json' },
      body: JSON.stringify(redirect)
    }, config)
      .then(response => response.json())
      .then(response => {

        if (!response.success) {
          throw Error(response.errors.reduce((errorString, error) => `${errorString} ${error.message}`, ''));
        }

        console.log('REDIRECT SAVE SUCCESS');

        return redirectId;
      })
      .catch(err => {
        console.error('ERROR SAVING REDIRECT', err);
      })

  }

  const onDeleteRedirect = async (redirectId) => {

    if (!window.confirm('Are you sure you wish to delete this item?')) {
      return;
    }

    console.log('DELETE REDIRECT', redirectId);

    return fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      headers : { 'Content-Type': 'application/json' },
      method: "DELETE",
    }, config)
      .then(response => response.json())
      .then(response => {

        if (!response.success) {
          throw Error(response.errors.reduce((errorString, error) => `${errorString} ${error.message}`), '');
        }

        console.log('REDIRECT DELETED', redirectId);
      })
      .catch(err => {
        console.error('ERROR DELETING REDIRECT', err);
      })

  }

  return (
    <ConfigContext.Provider value={config}>
      <Router>
        <AppNavbar />
        <Switch>
          <Route path="/google">
            <PageGoogleSearch onSaveRedirect={onSaveRedirect} onDeleteRedirect={onDeleteRedirect} />
          </Route>
          <Route path="/config">
            <PageConfig onSave={onSaveConfig} />
          </Route>
          <Route exact path="/">
            <PageExisting onSaveRedirect={onSaveRedirect} onDeleteRedirect={onDeleteRedirect} />
          </Route>
        </Switch>
      </Router>
      <Container>
        <Row>
          <Col>
            <footer>by Silverback Studio - <a href="https://github.com/silverbackstudio/cfw-redirects">GitHub repo</a></footer>
          </Col>
        </Row>
      </Container>
    </ConfigContext.Provider>
  );
}

export default withCookies(App);
