'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase-client';
import { Role } from '@/lib/types';
import { Users, Shield, Save } from 'lucide-react';
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
      // Update local state
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    }
    setUpdating(null);
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
         <h1 className="display-heavy text-[24px] uppercase dark:text-[var(--bg)]">Role Allocation & Access Control</h1>
         <span className="mono-data text-[10px] uppercase text-ink/50 dark:text-[var(--bg)]/50">SUPERIOR HEAD PRIVILEGES</span>
      </div>

      <div className="border shadow-ambient bg-card rounded-xl flex flex-col h-full bg-base dark:bg-[var(--ink)] dark:border-white">
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white px-4 py-3 bg-[var(--bg-surface)] dark:bg-[var(--ink)]/90">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 dark:text-[var(--bg)]" strokeWidth={2.5} />
            <h2 className="display-heavy text-[15px] uppercase dark:text-[var(--bg)]">Registered Users</h2>
          </div>
          <span className="mono-data text-[10px] uppercase tracking-[0.16em] text-ink/55 dark:text-[var(--bg)]/55">
            {profiles.length} TOTAL
          </span>
        </div>
        
        {error && (
          <div className="bg-[var(--danger)] text-[var(--bg)] p-3 text-[12px] font-bold uppercase tracking-wider text-center border-b-2 border-black">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center mono-data text-ink/50 text-[12px] uppercase">Loading profiles...</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-black dark:border-white text-[10px] uppercase tracking-[0.14em] text-ink/60 dark:text-[var(--bg)]/60">
                  <th className="px-4 py-3">User ID / Profile</th>
                  <th className="px-4 py-3">Display Name</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3 text-right">Assign New Role</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-black/15 text-[12px] transition-colors hover:bg-[var(--bg-surface)] dark:hover:bg-base/5">
                    <td className="px-4 py-3 align-middle">
                      <div className="mono-data font-semibold dark:text-[var(--bg)]">{profile.id}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="font-medium dark:text-[var(--bg)] uppercase">{profile.display_name}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <BrutalTag>{profile.role}</BrutalTag>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        {updating === profile.id ? (
                          <span className="mono-data text-[10px] uppercase animate-pulse text-ink/50 dark:text-[var(--bg)]/50">Updating...</span>
                        ) : (
                          <select 
                            className="border bg-base dark:bg-[var(--ink)] dark:text-[var(--bg)] px-2 py-1.5 text-[10px] mono-data font-bold uppercase cursor-pointer hover:bg-surface focus:outline-none focus:ring-2 focus:ring-black"
                            value={profile.role}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as Role)}
                          >
                            {AVAILABLE_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        )}
                        <Shield className="h-4 w-4 text-ink/40 dark:text-[var(--bg)]/40" />
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
