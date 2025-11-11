import { useState } from 'react';
import {
  validateUsername,
  validatePassword,
  PipeErrorCode,
} from 'firestarter-sdk';

interface AuthCardProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onCreate: (username: string, password: string) => Promise<void>;
}

function AuthCard({ onLogin, onCreate }: AuthCardProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation using SDK helpers
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error!);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error!);
      return;
    }

    setLoading(true);

    try {
      if (isCreating) {
        await onCreate(username, password);
      } else {
        await onLogin(username, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);

      // Use structured error codes from SDK
      let errorMessage = err.message || 'Authentication failed';

      if (err.code) {
        switch (err.code) {
          case PipeErrorCode.USERNAME_EXISTS:
            errorMessage = 'Username already exists. Please try a different username or login instead.';
            break;
          case PipeErrorCode.INVALID_CREDENTIALS:
            errorMessage = 'Invalid username or password. Please check your credentials.';
            break;
          case PipeErrorCode.UNAUTHORIZED:
            errorMessage = 'Authentication failed. Please try again.';
            break;
          case PipeErrorCode.NETWORK_ERROR:
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            // Use the message from the SDK
            errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {isCreating ? 'Create Account' : 'Login'}
        </h2>
        <p className="text-sm text-gray-600">
          {isCreating
            ? 'Get started with Firestarter storage'
            : 'Access your decentralized storage'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            placeholder="Enter password"
            required
          />
          {isCreating && (
            <p className="text-xs text-gray-500 mt-1">
              Must be 8+ characters with uppercase, lowercase, numbers, and symbols
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          style={{ backgroundColor: loading ? undefined : '#FF6B35' }}
        >
          {loading ? 'Please wait...' : (isCreating ? 'Create Account' : 'Login')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsCreating(!isCreating);
            setError('');
          }}
          className="text-sm font-medium hover:opacity-80"
          style={{ color: '#FF6B35' }}
        >
          {isCreating ? 'Already have an account? Login' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}

export default AuthCard;
