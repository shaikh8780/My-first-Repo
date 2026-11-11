import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { configureAuth } from './auth/amplifyConfig';
import App from './App';
import { ReportProvider } from './context/ReportContext';

configureAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ReportProvider>
        <App />
      </ReportProvider>
    </BrowserRouter>
  </React.StrictMode>
);
