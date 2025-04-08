import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AppRoutes } from './routes';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-200 text-gray-100">
          <Layout>
            <AppRoutes />
          </Layout>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;