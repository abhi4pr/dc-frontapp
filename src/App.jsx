import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import renderRoutes, { routes } from './routes';

// go into routes file for binding anything in main app

const App = () => {
  return <BrowserRouter basename={import.meta.env.VITE_APP_BASE_NAME}>{renderRoutes(routes)}</BrowserRouter>;
};

export default App;
