import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  // Handle successful authentication
  if (auth.isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  // Handle loading state
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  // Handle login
  const handleLogin = () => {
    auth.signinRedirect();
  };

  return (
    <div className="max-w-xl mx-auto grid gap-y-4 py-4">
      <button
        onClick={handleLogin}
        className="inline-flex items-center justify-center px-4 py-2 border border-transparent bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 cursor-pointer focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium"
      >
        Sign In with Cognito
      </button>
    </div>
  );
};

export default Login;
