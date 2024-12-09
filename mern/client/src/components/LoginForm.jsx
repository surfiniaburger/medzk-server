import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect successful:', result);
          const destination = location.state?.from || '/';
          console.log('Navigating to:', destination);
          navigate(destination, { replace: true });
        }
      } catch (err) {
        console.error('Error in redirect result:', err.message);
        setError(err.message);
      }
    };

    handleRedirectResult();
  }, [navigate, location]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting email sign-in for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      const destination = location.state?.from || '/';
      console.log('Navigating to:', destination);
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Email sign-in error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('Starting Google sign-in redirect...');
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error('Google sign-in error:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full mb-4"
            variant="outline"
          >
            Continue with Google
          </Button>

          <div className="relative my-4">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-gray-50 px-2 text-gray-500 text-sm">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
