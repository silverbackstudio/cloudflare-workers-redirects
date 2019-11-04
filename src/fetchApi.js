export default function fetchApi(path, payload, config){
  
  const API_PROXY = '';
  const API_ENDPOINT = `/client/v4/accounts/${config.cfAccount}/storage/kv/`;
  
  let url = API_PROXY + API_ENDPOINT + path;
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

  return fetch(url, options);
}