export default function fetchApi(path, payload, config){
    
  const API_ENDPOINT = `http://localhost:8010/client/v4/accounts/${config.cfAccount}/storage/kv/`;
  
  let url = API_ENDPOINT + path;
  let options = Object.assign(
    {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Email' : config.cfEmail,
        'X-Auth-Key': config.cfKey
      }, 
    },
    payload
  );

  console.log('REQ OPTIONS', options);

  return fetch(url, options);

}