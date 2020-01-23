import React, { useState, useEffect } from 'react';
import Redirect from './Redirect';
import RedirectForm from './RedirectForm';
import ConfigForm from './ConfigForm';
import ConfigContext from './ConfigContext';
import fetchApi from './fetchApi';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import calculateHash from './hash';
import { Row, Container, Col, Table  } from 'react-bootstrap';

const PAGE_SIZE = 10;

function App() {

  const [config, setConfig] = useState({
    cfKey: '',
    cfEmail: '',
    cfAccount: '',
    cfNamespace: ''
  });

  const [redirects, setRedirects] = useState(new Set());
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState(['']);
  const [loading, setLoading] = useState(false);

  const onSaveConfig = (newConfig) => {
    setConfig(newConfig);
  }

  useEffect(() => {

    if (!config.cfNamespace || !config.cfAccount || !config.cfEmail || !config.cfKey) {
      return;
    }

    setLoading(true);

    const cursor = cursors[page];

    let url = `namespaces/${config.cfNamespace}/keys?limit=${PAGE_SIZE}`;

    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    fetchApi(url, { method: "GET", headers: { 'Content-Type': 'application/json' }, cache: "force-cache" }, config)
      .then(response => response.json())
      .then(response => {

        console.log('GET REDIRECT INDEX', response);

        if (response.success === false) {
          throw Error(response.errors.reduce((errorString, error) => `${errorString} ${error.message}`), '');
        }

        if (response.result_info && response.result_info.cursor) {
          cursors[page + 1] = response.result_info.cursor;
          setCursors(cursors);
        }

        setRedirects(new Set(response.result.map((item) => item.name)));
        setLoading(false);
      })
      .catch((err) => {
        console.error('ERROR IN FETCH INDEX', err);
        setLoading(false);
      });

  }, [config, page, cursors]);

  console.log('CURRENT REDIRECTS', redirects);

  const onAddRedirect = async (redirect) => {

    if ( !redirect.match || !redirect.destination) {
      console.error('Missing redirect informations', redirect );
      return;
    }

    const redirectId = await calculateHash(redirect.match);

    console.log('CREATE NEW REDIRECT %s with id: %s', redirect, redirectId);

    return fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "PUT",
      body: JSON.stringify(redirect)
    }, config)
      .then(response => response.json())
      .then(response => {

        if (!response.success) {
          throw Error(response.errors.reduce((errorString, error) => `${errorString} ${error.message}`, ''));
        }

        console.log('REDIRECT SAVE SUCCESS');

        let newRedirects = new Set( redirects );

        newRedirects.add(redirectId);

        console.log('UPDATE REDIRECTS', newRedirects);

        setRedirects(newRedirects);
      })
      .catch(err => {
        console.error('ERROR SAVING REDIRECT', err);
      })

  }

  const onRedirectDelete = (htmlEvent) => {

    const redirectId = htmlEvent.target.getAttribute('data-id');

    if (!window.confirm('Are you sure you wish to delete this item?')) {
      return;
    }

    console.log('DELETE REDIRECT', redirectId);

    return fetchApi(`namespaces/${config.cfNamespace}/values/${redirectId}`, {
      method: "DELETE",
    }, config)
      .then(response => response.json())
      .then(response => {

        if (!response.success) {
          throw Error(response.errors.reduce((errorString, error) => `${errorString} ${error.message}`), '');
        }

        redirects.delete(redirectId);
        setRedirects(redirects);

        console.log('REDIRECT DELETED', redirectId);
      })
      .catch(err => {
        console.error('ERROR DELETING REDIRECT', err);
      })

  }

  const changePage = (direction = 1) => {
    redirects.clear();
    setRedirects(redirects);
    setPage(page + direction);
  }

  return (
    <ConfigContext.Provider value={config}>
        <Container className="App">
          <Row>
            <Col>
              <header className="App-header">
                <h1>Cloudflare Workers Redirect Manager</h1>
              </header>            
            </Col>
          </Row>
          <Row>
            <Col>
              <h2>Authentication</h2>
              <ConfigForm onSubmit={onSaveConfig} />
            </Col>
            <Col>
              <h2>Add Redirect</h2>
              <RedirectForm onSubmit={onAddRedirect} disallowSubmit={ !config.cfNamespace } />
            </Col>
          </Row>
          <Row id="redirects">
            <Col>
              <h2>Existing Redirects</h2>
              {loading && (<div className="loading">Loading..</div>)}
              {redirects.size > 0 && (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(redirects.values()).map(redirectId => (<Redirect redirectId={redirectId} key={redirectId} onDelete={onRedirectDelete} />))}
                  </tbody>
                </Table>
              )}
              {(page > 0) && (<button onClick={() => changePage(-1)} >Prev Page</button>)}
              {(cursors[page + 1]) && (<button onClick={() => changePage()} >Next Page</button>)}
            </Col>
          </Row>
          <Row id="redirects">
            <Col>
            <footer>by Silverback Studio - <a href="https://github.com/silverbackstudio/cfw-redirects">GitHub repo</a></footer>            
            </Col>        
          </Row>
        </Container>
      </ConfigContext.Provider>
  );
}

export default App;
