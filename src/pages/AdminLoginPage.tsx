import {useEffect, useState, type FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {Lock, Eye, EyeOff} from 'lucide-react';
import {getAuthorizedAdminSession, signInAdmin} from '../lib/auth';
import {isSupabaseConfigured} from '../lib/supabase';
import {SetupRequiredState} from '../components/common/SetupRequiredState';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Admin Sign In — QR Menu';
    if (!isSupabaseConfigured) {
      setCheckingSession(false);
      return;
    }

    let isMounted = true;
    getAuthorizedAdminSession()
      .then((auth) => {
        if (!isMounted) return;
        if (auth) {
          navigate('/admin/dashboard', {replace: true});
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        if (isMounted) setCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (!isSupabaseConfigured) {
    return <SetupRequiredState context="admin" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInAdmin(trimmedEmail, password);
      navigate('/admin/dashboard', {replace: true});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6">
        <p className="text-sm text-stone-600">Checking administrator session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-stone-900 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-xl p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-stone-900">
              Administrator Sign In
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">Private menu management access</p>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-stone-800 mb-1.5">
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full h-11 px-3.5 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 pl-3.5 pr-11 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-500 hover:text-stone-800 rounded-md"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 mt-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="mt-6 pt-5 border-t border-stone-100 text-xs text-stone-500 leading-relaxed">
          Authorized business administrator only. Public registration is disabled.
        </p>
      </div>
    </div>
  );
}
