import {Database} from 'lucide-react';
import {supabaseConfigIssue} from '../../lib/supabase';

interface SetupRequiredStateProps {
  context: 'public-menu' | 'admin';
}

export function SetupRequiredState({context}: SetupRequiredStateProps) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1B18] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl bg-white border border-[#E6DFD3] rounded-xl p-8 sm:p-10">
        <div className="w-11 h-11 rounded-lg bg-[#F2ECE1] flex items-center justify-center text-[#1F1B18] mb-6">
          <Database className="w-5 h-5" strokeWidth={1.75} />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#1F1B18]">
          {supabaseConfigIssue ? 'Invalid Supabase URL Configuration' : 'Supabase Setup Required'}
        </h1>

        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5C534A]">
          {supabaseConfigIssue
            ? supabaseConfigIssue
            : context === 'admin'
              ? 'This application requires an active Supabase project connection before administrator sign-in and menu management can run.'
              : 'This digital menu is not connected to its Supabase database yet.'}
        </p>

        <div className="mt-6 border-t border-[#ECE6DA] pt-6 space-y-3 text-sm text-[#4A423B]">
          <p className="font-medium text-[#1F1B18]">Required environment variables:</p>
          <ul className="space-y-2 font-mono text-xs bg-[#FAF7F2] border border-[#E6DFD3] rounded-lg p-4 text-[#2B2520]">
            <li>VITE_SUPABASE_URL=&quot;https://your-project-ref.supabase.co&quot;</li>
            <li>VITE_SUPABASE_ANON_KEY=&quot;your-publishable-anon-key&quot;</li>
          </ul>
          <p className="text-xs leading-relaxed text-[#6B6259]">
            Find your Project URL under <strong>Project Settings → Data API</strong> in Supabase
            (not the browser dashboard URL). Add these values to your{' '}
            <code className="font-mono text-[#1F1B18]">.env</code> file, execute the SQL
            migrations in <code className="font-mono text-[#1F1B18]">supabase/migrations/</code>,
            and see <code className="font-mono text-[#1F1B18]">README.md</code> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
