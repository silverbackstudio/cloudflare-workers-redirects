import React from 'react';

 const ConfigContext = React.createContext({
  cfKey: '',
  cfAccount: '',
  cfNamespace: ''
});

export default ConfigContext;