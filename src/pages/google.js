import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, Accordion, Button, Pagination } from 'react-bootstrap';
import ConfigContext from '../components/ConfigContext';
import fetchJsonp from 'fetch-jsonp';
import Redirect from '../components/Redirect';
import { Form } from 'react-bootstrap';

const PAGE_SIZE = 10;

function GoogleSearchDomainForm(props) {

  const { onSubmit } = props;

  const config = useContext(ConfigContext);

  const [domain, setDomain] = useState('');

  const handleDomainChange = (event) => {
    const target = event.target;
    const value =
      target.type === 'checkbox'
        ? target.checked
        : target.value;

    setDomain( value );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if ( onSubmit ) {
      onSubmit(domain);
    }
  }

  return (
    <Form id="cse" onSubmit={handleSubmit}>
      <Form.Group controlId="cseQuery">
        <Form.Label>Domain</Form.Label>
        <Form.Control type="text" placeholder="example.com" onChange={handleDomainChange} />
      </Form.Group>
      <Button variant="primary" type="submit" disabled={!config.cseKey || !config.cseId}>
        Search
      </Button>
    </Form>
  )
}

function PageGoogleSearch(props) {

  const {
    onSaveRedirect,
    onDeleteRedirect,
  } = props;

  const config = useContext(ConfigContext);

  const [redirects, setRedirects] = useState([]);
  const [domain, setDomain] = useState('');
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  const { cseKey, cseId } = config;

  useEffect(() => {

    if ( !cseKey || !cseId || !domain ) {
      console.warn('No keys or domain');
      return;
    }
  
    let url = 'https://www.googleapis.com/customsearch/v1'
    url += `?key=${cseKey}`;
    url += `&cx=${cseId}`;
    url += `&q=site:${encodeURIComponent(domain)}`;
    url += `&num=${PAGE_SIZE}`;
  
    if (page) {
      url += `&start=${page * PAGE_SIZE}`;
    }
  
    setLoading(true);
  
    fetchJsonp(url)
      .then(function (response) {
        return response.json()
      })
      .then(function (response) {

        if ( response.items ){
          setRedirects( response.items.map(item => ({ match: item.link }) ) );
        } else {
          setRedirects([]);
        }
  
        if (response.searchInformation && response.searchInformation.totalResults ) {
          setTotalResults( Number(response.searchInformation.totalResults) );
        }
  
        setLoading(false);
      })
      .catch(function (ex) {
        console.error('CSE parsing failed', ex)
      });    
      
  }, [cseKey, cseId, page, domain] );

  const changePage = (direction = 1) => {
    setPage(page + direction);
  }

  const onSearch = (domain) => {
    setDomain(domain);
  }

  const handleDelete = (redirectId, index) => {
    return onDeleteRedirect(redirectId)
      .then(() => {
        let newRedirects = redirects.concat();
        newRedirects[index] = Object.assign({}, newRedirects[index], { destination: "" })
        setRedirects(newRedirects);
      });
  }

  console.log();

  const pages = Array.from(Array(Math.ceil( totalResults / PAGE_SIZE )).keys());

  return (
    <Container className="existing" id="redirects" >
      <Row >
        <Col>
          <h2>Google Search Mapping</h2>
          <GoogleSearchDomainForm onSubmit={onSearch} />
          {loading && (<div className="loading">Loading..</div>)}
          {redirects.length > 0 && (
            <Accordion defaultActiveKey="0">
              {
                redirects.map(
                  (redirect, index) => (
                    <Redirect
                      redirect={redirect}
                      key={redirect.match}
                      onDelete={(redirectId) => handleDelete(redirectId, index)} 
                      onSave={onSaveRedirect}
                      isPreset
                    />
                  )
                )
              }
            </Accordion>
          )}

          <Pagination>
            <Pagination.First onClick={ () => setPage(0) } />
            <Pagination.Prev onClick={ () => changePage(-1) } />
            {  pages.map( 
              currentPage => (
                <Pagination.Item key={currentPage} active={currentPage === page} onClick={ () => setPage(currentPage) } >
                  {currentPage}
                </Pagination.Item>
              )
            )}
            <Pagination.Next onClick={ () => changePage(1) } />              
            <Pagination.Last onClick={ () => setPage(Math.ceil( totalResults / PAGE_SIZE )-1) } />          
          </Pagination>
        </Col>
      </Row>
    </Container>
  );
}

export default PageGoogleSearch;
