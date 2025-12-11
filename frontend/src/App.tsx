import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/api';
import Login from './pages/Login';
import Terminal from './pages/Terminal';
import FileExplorer from './pages/FileExplorer';
import './styles/global.css';
import './components/FileList.css';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

// Redirect to terminal if already authenticated
function LoginRoute({ children }: { children: React.ReactNode }) {
  return !isAuthenticated() ? <>{children}</> : <Navigate to="/terminal" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginRoute>
              <Login />
            </LoginRoute>
          }
        />
        <Route
          path="/terminal"
          element={
            <ProtectedRoute>
              <Terminal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FileExplorer />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/terminal" replace />} />
        <Route path="*" element={<Navigate to="/terminal" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
