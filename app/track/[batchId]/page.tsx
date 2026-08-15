'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase-client';
import { Batch } from '@/lib/types';
import { Map, Users, Eye, CheckCircle, ShieldAlert, Package, Activity } from 'lucide-react';
import { StatusPill } from '@/components/primitives';
import { fmtDate } from '@/lib/format';
import { shortHash } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { contractExplorerUrl } from '@/lib/explorer';

export default function TrackPage({ params }: { params: { batchId: string } }) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState(1);
  const supabase = getSupabase();

  useEffect(() => {
    if (!supabase) return;
    
    // Fetch initial data
    async function fetchBatch() {
      const { data, error } = await supabase!
        .from('Batches')
        .select('*')
        .eq('batchId', params.batchId)
        .single();
        
      if (data) {
        setBatch(data as Batch);
      }
      setLoading(false);
    }
    fetchBatch();

    // Supabase Realtime Subscription for Batch updates
    const sub = supabase.channel(`public:Batches:batchId=eq.${params.batchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Batches', filter: `batchId=eq.${params.batchId}` }, (payload) => {
        setBatch(payload.new as Batch);
      })
      .subscribe();
      
    // Supabase Presence for live viewers
    const room = supabase.channel(`track_presence:${params.batchId}`);
    
    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        let count = 0;
        for (const id in state) count += state[id].length;
        setViewers(count > 0 ? count : 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(sub);
      supabase.removeChannel(room);
    };
  }, [params.batchId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
        <div className="text-[12px] mono-data uppercase font-bold animate-pulse">Locating Batch...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
        <div className="border shadow-ambient bg-card rounded-xl p-8 text-center max-w-md w-full">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-[var(--danger)]" strokeWidth={2} />
          <h1 className="text-[24px] display-heavy uppercase mb-2">Not Found</h1>
          <p className="text-[14px] text-ink/70 mono-data">The requested batch could not be found on the ledger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="border-b-2 border-black bg-[#102A43] text-[var(--bg)] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          <span className="text-[14px] font-bold uppercase tracking-[0.14em]">MediTrace Tracker</span>
        </div>
        <div className="flex items-center gap-2 bg-base/10 px-3 py-1.5 border border-white/20">
          <Eye className="h-4 w-4" />
          <span className="text-[12px] mono-data font-bold">{viewers} viewing live</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Status Banner */}
        <div className={cn(
          "border-4 border-black p-6 md:p-8 relative overflow-hidden shadow-ambient",
          batch.currentStatus === 'Verified' ? "bg-[var(--success)]/10" :
          batch.currentStatus === 'Spoiled' ? "bg-[var(--danger)]/10" : "bg-[var(--bg-surface)]"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Package className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="mono-data text-[12px] text-ink/50 uppercase tracking-[0.1em] mb-1">Product Origin</div>
              <h1 className="text-[32px] md:text-[48px] display-heavy uppercase leading-tight mb-2">{batch.productName}</h1>
              <div className="flex items-center gap-3">
                <StatusPill status={batch.currentStatus} />
                <span className="mono-data text-[12px] bg-[var(--ink)] text-[var(--bg)] px-2 py-0.5">{batch.manufacturerLabel}</span>
              </div>
            </div>
            
            <div className="bg-base border-2 border-black p-4 text-left md:text-right min-w-[200px]">
              <div className="mono-data text-[10px] text-ink/50 uppercase mb-1">Batch Identifier</div>
              <div className="font-bold text-[14px] mono-data mb-2">{batch.batchId}</div>
              <div className="mono-data text-[10px] text-ink/50 uppercase mb-1">GS1 Serial</div>
              <div className="font-bold text-[14px] mono-data">{batch.serial}</div>
            </div>
          </div>
        </div>

        {/* Telemetry Snapshot */}
        {batch.telemetry && batch.telemetry.length > 0 && (
          <div className="border shadow-ambient bg-card rounded-xl p-6 border-l-[8px] border-l-[#102A43]">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-[#102A43]" />
              <h2 className="text-[16px] font-bold uppercase tracking-[0.1em]">Transport Telemetry</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-black/20 p-3 bg-[var(--bg-surface)]">
                <div className="text-[10px] mono-data text-ink/50 uppercase mb-1">Total Pings</div>
                <div className="text-[18px] font-bold mono-data">{batch.telemetry.length}</div>
              </div>
              <div className="border border-black/20 p-3 bg-[var(--bg-surface)]">
                <div className="text-[10px] mono-data text-ink/50 uppercase mb-1">Breaches</div>
                <div className="text-[18px] font-bold mono-data text-[var(--danger)]">
                  {batch.telemetry.filter(t => t.breached).length}
                </div>
              </div>
              <div className="border border-black/20 p-3 bg-[var(--bg-surface)] col-span-2">
                <div className="text-[10px] mono-data text-ink/50 uppercase mb-1">Latest Temp</div>
                <div className="text-[18px] font-bold mono-data">
                  {batch.telemetry[batch.telemetry.length - 1].temperature}°C
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
