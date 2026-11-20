import {useEffect, useState, type ReactNode} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {getAuthorizedAdminSession, type AuthorizedAdminSession} from '../../lib/auth';
import {isSupabaseConfigured, supabase} from '../../lib/supabase';
import {SetupRequiredState} from '../common/SetupRequiredState';

interface ProtectedAdminRouteProps {
  children: (auth: AuthorizedAdminSession) => ReactNode;
}

export function ProtectedAdminRoute({children}: ProtectedAdminRouteProps) {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'error'>(
    'loading'
  );
  const [authSession, setAuthSession] = useState<AuthorizedAdminSession | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    const verify = async () => {
      try {
        const result = await getAuthorizedAdminSession();
        if (!isMounted) return;
        if (result) {
          setAuthSession(result);
          setStatus('authorized');
        } else {
          setAuthSession(null);
          setStatus('unauthorized');
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to verify administrator session.'
        );
        setStatus('error');
      }
    };

    verify();

    const {data: subscription} = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthSession(null);
        setStatus('unauthorized');
      } else {
        verify();
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <SetupRequiredState context="admin" />;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6">
        <div className="text-sm text-stone-600 font-medium">Verifying administrator access...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-xl p-6">
          <h1 className="text-base font-semibold text-stone-900">Authentication Check Failed</h1>
          <p className="mt-2 text-sm text-stone-600">{errorMessage}</p>
          <a
            href="/admin/login"
            className="mt-4 inline-block px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Return to Admin Login
          </a>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized' || !authSession) {
    return <Navigate to="/admin/login" state={{from: location.pathname}} replace />;
  }

  return <>{children(authSession)}</>;
}
