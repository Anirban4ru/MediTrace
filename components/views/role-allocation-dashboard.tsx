'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase-client';
import { Role } from '@/lib/types';
import { Users, Shield } from 'lucide-react';
import { BrutalTag } from '@/components/primitives';

interface UserProfile {
  id: string;
  role: Role;
  display_name: string;
}

const AVAILABLE_ROLES: Role[] = [
  'SUPERIOR_HEAD_ROLE',
  'ADMIN_ROLE',
  'MANUFACTURER_ROLE',
  'CARRIER_ROLE',
  'INSPECTOR_ROLE',
  'VISITOR_ROLE'
];

export function RoleAllocationDashboard() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const supabase = getSupabase();
    if (!supabase) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .order('display_name', { ascending: true });
      
    if (error) {
      console.error(error);
      setError('Failed to fetch user profiles.');
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    const supabase = getSupabase();
    if (!supabase) return;

    setUpdating(userId);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (updateError) {
      console.error(updateError);
      setError(`Failed to update role for user ID: ${userId}`);
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    }
    setUpdating(null);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-heavy text-2xl uppercase" style={{ color: 'var(--ink)' }}>
            Role Allocation & Access Control
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
            Assign cryptographic privileges and dashboard access across organizations.
          </p>
        </div>
        <span className="mono-data text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded" style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          SUPERIOR HEAD PRIVILEGES
        </span>
      </div>

      <div 
        className="rounded-xl overflow-hidden" 
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--ink)' }}>
              Registered Personnel
            </h2>
          </div>
          <span className="mono-data text-xs font-bold" style={{ color: 'var(--ink-muted)' }}>
            {profiles.length} TOTAL
          </span>
        </div>
        
        {error && (
          <div className="p-3 text-xs font-bold uppercase tracking-wider text-center" style={{ background: 'var(--danger-faint)', color: 'var(--danger)', borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center mono-data text-xs uppercase" style={{ color: 'var(--ink-muted)' }}>
              Loading cryptographic identities…
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[10px] uppercase font-bold tracking-[0.14em]" style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', background: 'var(--bg)' }}>
                  <th className="px-6 py-3.5">User ID / Profile</th>
                  <th className="px-6 py-3.5">Display Name</th>
                  <th className="px-6 py-3.5">Current Role</th>
                  <th className="px-6 py-3.5 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr 
                    key={profile.id} 
                    className="text-xs transition-colors hover:bg-[var(--accent-faint)]"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-6 py-4 align-middle">
                      <div className="mono-data font-semibold text-xs" style={{ color: 'var(--ink)' }}>
                        {profile.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-xs uppercase" style={{ color: 'var(--ink)' }}>
                        {profile.display_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <BrutalTag>{profile.role}</BrutalTag>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        {updating === profile.id ? (
                          <span className="mono-data text-[10px] uppercase animate-pulse" style={{ color: 'var(--accent)' }}>
                            Updating…
                          </span>
                        ) : (
                          <select 
                            className="px-3 py-1.5 text-xs mono-data font-bold uppercase rounded cursor-pointer focus:outline-none"
                            style={{
                              background: 'var(--bg)',
                              color: 'var(--ink)',
                              border: '1px solid var(--border)',
                            }}
                            value={profile.role}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as Role)}
                          >
                            {AVAILABLE_ROLES.map(role => (
                              <option key={role} value={role} style={{ background: 'var(--bg-surface)', color: 'var(--ink)' }}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                        <Shield className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
