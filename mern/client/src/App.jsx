// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/Profile';
import ProofVerification from './components/ProofVerification';
import Vision from './components/Vision';
import VideoUpload from './components/VideoUpload';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';

const App = () => {
  return (
    <div className="w-full p-6">
      <LoginButton /> <LogoutButton /> {/* Place login/logout buttons strategically */}
      <Routes>
        <Route path="/login" element={<LoginButton />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Profile /> {/* Display user profile when logged in */}
              <ProofVerification />
              <Vision />
              <VideoUpload />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
