'use client';

import { useAuth } from '@/context/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your profile.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 font-semibold">Profile</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-400">Email: </span>{user.email}</p>
          <p><span className="text-gray-400">Role: </span>{user.role}</p>
        </div>
      </div>
    </div>
  );
}
