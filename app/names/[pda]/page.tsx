import { Suspense } from 'react';
import { NameDetail } from './NameDetail';

async function Resolved({ params }: { params: Promise<{ pda: string }> }) {
  const { pda } = await params;
  return <NameDetail pda={pda} />;
}

export default function Page({ params }: { params: Promise<{ pda: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 pt-12"><div className="skeleton h-64" /></div>}>
      <Resolved params={params} />
    </Suspense>
  );
}
