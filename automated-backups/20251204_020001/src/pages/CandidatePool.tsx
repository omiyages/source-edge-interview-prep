import { CandidatePoolDashboard } from '@/components/CandidatePoolDashboard';

export default function CandidatePool() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Candidate Pool Analytics</h1>
      <CandidatePoolDashboard />
    </div>
  );
} 