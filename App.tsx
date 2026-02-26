import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AssessmentProvider } from './context/AssessmentContext';
import { AppRouter } from './router/AppRouter';
import './styles.css';

function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <AppRouter />
      </AssessmentProvider>
    </AuthProvider>
  );
}

export default App;