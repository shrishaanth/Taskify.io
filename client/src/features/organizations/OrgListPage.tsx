import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../stores/api.client';
import { Button } from '../../v2components/primitives/Button';
import { Dialog } from '../../v2components/primitives/Dialog';
import { Input } from '../../v2components/primitives/Input';
import { Plus, Building2 } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
}

export const OrgListPage: React.FC = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState('');

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const data = await api.get<Org[]>('/orgs');
      setOrgs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrgs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const org = await api.post<Org>('/orgs', form);
      setOrgs((prev) => [...prev, org]);
      setShowCreate(false);
      setForm({ name: '', slug: '', description: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your organizations and workspaces
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Organization
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : orgs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No organizations yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Create your first organization to get started.
          </p>
          <Button onClick={() => setShowCreate(true)}>Create Organization</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              onClick={() => navigate(`/orgs/${org.slug}`)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold">
                  {org.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{org.slug}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {org.description || 'No description'}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Organization">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
              }));
            }}
            placeholder="Acme Corp"
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="acme-corp"
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="A short description"
          />
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
