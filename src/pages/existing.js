import React, { useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Accordion, Pagination, Button } from 'react-bootstrap';
import ConfigContext from '../components/ConfigContext';
import fetchApi from '../lib/cloudflareRedirects';
import Redirect from '../components/Redirect';

const PAGE_SIZE = 10;

function PageExisting(props) {

  const {
    onSaveRedirect,
    onDeleteRedirect,
  } = props;

  const config = useContext(ConfigContext);

  const [redirects, setRedirects] = useState([]);
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState(['']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (!config.cfNamespace || !config.cfAccount  || !config.cfKey) {
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

        setRedirects(response.result.map((item) => ({ sha1: item.name })));
        setLoading(false);
      })
      .catch((err) => {
        console.error('ERROR IN FETCH INDEX', err);
        setLoading(false);
      });

  }, [config, page, cursors]);

  const changePage = (direction = 1) => {
    setPage(page + direction);
  }

  const onAddNew = () =>{
    setRedirects(redirects.concat([{ sha1:'' }]));
  }

  const handleSave = (redirect, index) => {
    return onSaveRedirect(redirect)
      .then((redirectId) => {
        let newRedirects = redirects.concat();
        newRedirects[index] = Object.assign( {sha1: redirectId} , redirect)
        setRedirects(newRedirects);
        return redirectId;
      });
  }

  const handleDelete = (redirectId, index) => {
    return onDeleteRedirect(redirectId)
      .then(() => {
        let newRedirects = redirects.concat();
        newRedirects.splice(index, 1)
        setRedirects(newRedirects);
      });
  }

  console.log(redirects);

  return (
    <Container className="existing" >
      <Row >
        <Col>
          <h2>Existing Redirects</h2>
          <Button onClick={onAddNew}>Add</Button>
          {loading && (<div className="loading">Loading..</div>)}
          {redirects.length > 0 && (
            <Accordion defaultActiveKey="0">
              {
                redirects.map(
                  (redirect, index) => (
                    <Redirect
                      redirectId={redirect.sha1} 
                      key={redirect.sha1} 
                      onDelete={(redirectId) => handleDelete(redirectId, index)} 
                      onSave={ (redirect) => handleSave(redirect, index) } 
                    />
                  )
                )
              }
            </Accordion>
          )}
          <Pagination>
            <Pagination.Prev onClick={() => changePage(-1)} disabled={ page < 1 }/>
            <Pagination.Next onClick={() => changePage()} disabled={!cursors[page + 1]} />
          </Pagination>
        </Col>
      </Row>
    </Container>
  );
}

export default PageExisting;
