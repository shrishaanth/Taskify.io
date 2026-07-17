import { useEffect, useState, type FormEvent } from "react";
import AppSidebar from "../Components/AppSideBar";
import { usersApi, type ApiUser } from "../api/users";
import { useAuth } from "../Context/AuthContext";
import { useSocket } from "../Context/SocketContext";
import { Plus, KeyRound, Trash2, X } from "lucide-react";

/**
 * Admin-only member management. This is the ONLY place a Member account
 * can be created — there is no self-registration path once an Admin
 * already exists (see auth.controller.ts -> register).
 */
const Users = () => {
  const { user: currentUser } = useAuth();
  const { socket, online } = useSocket();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ApiUser | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Another admin created/edited/deleted a user — reflect it immediately.
  useEffect(() => {
    if (!socket) return;
    const onUserChanged = () => {
      usersApi.list().then(setUsers).catch(() => { /* transient */ });
    };
    socket.on("user:changed", onUserChanged);
    return () => { socket.off("user:changed", onUserChanged); };
  }, [socket]);

  const handleRoleChange = async (u: ApiUser, role: "admin" | "member") => {
    setError(null);
    try {
      await usersApi.update(u.id, { role });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (u: ApiUser) => {
    if (!window.confirm(`Remove ${u.name}? This cannot be undone.`)) return;
    setError(null);
    try {
      await usersApi.delete(u.id);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create and manage Member accounts. Only Admins can do this.
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Member
            </button>
          </header>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading users...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                          <span className="inline-flex items-center gap-2">
                            {/* Presence: green dot = has a live session anywhere in the cluster */}
                            <span
                              title={online.has(u.id) ? "Online" : "Offline"}
                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${online.has(u.id) ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                            />
                            {u.name} {isSelf && <span className="text-xs text-gray-400">(you)</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                        <td className="px-5 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as "admin" | "member")}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs capitalize focus:outline-none focus:border-blue-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setResetTarget(u)}
                              title="Reset password"
                              className="rounded p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={isSelf}
                              title={isSelf ? "You cannot delete your own account" : "Delete user"}
                              className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <CreateMemberDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
};

const CreateMemberDialog = ({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" as "admin" | "member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.create(form);
      setForm({ name: "", email: "", password: "", role: "member" });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5">
        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Member</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Temporary Password</label>
            <input required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "member" })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Creating..." : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResetPasswordDialog = ({ user, onClose }: { user: ApiUser | null; onClose: () => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setPassword(""); setError(""); setDone(false); }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.resetPassword(user.id, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reset Password</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">for {user.name}</p>
        {done ? (
          <div>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">Password updated successfully.</p>
            <button onClick={onClose} className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required minLength={6} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
              <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {loading ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Users;
