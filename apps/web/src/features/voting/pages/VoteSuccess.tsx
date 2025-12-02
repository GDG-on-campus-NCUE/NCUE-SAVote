import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';

export const VoteSuccess: React.FC = () => {
  const location = useLocation();
  const receipt = location.state?.receipt;

  if (!receipt) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-red-300">No Receipt Found</h1>
          <p className="mt-4 text-gray-300">Please return to the dashboard.</p>
          <Link to="/" className="mt-6 inline-block glass-subtle px-4 py-2 rounded-md text-blue-200 hover:text-white">
            Go to Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="success-icon bg-green-500/20 text-green-200 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-white">Vote Cast Successfully!</h1>
        <p className="text-gray-300 mb-8">
          Your vote has been anonymously recorded. Below is your digital receipt.
        </p>

        <GlassCard>
          <h3 className="text-sm font-semibold text-blue-200 uppercase tracking-wider mb-2">
            Vote Receipt (Nullifier Hash)
          </h3>
          <code className="block bg-white/5 border border-white/10 p-3 rounded text-sm break-all font-mono text-gray-100">
            {receipt.nullifier}
          </code>
          <p className="text-xs text-gray-300 mt-2">
            Keep this hash to verify your vote was counted in the final tally.
          </p>
        </GlassCard>

        <div className="flex justify-center gap-4 mt-6">
          <Link 
            to="/"
            className="px-6 py-2 glass-strong border border-blue-400/50 text-white rounded-lg hover:border-blue-400/80 hover:bg-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 backdrop-blur-xl"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
};
