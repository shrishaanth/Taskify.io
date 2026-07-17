import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { tasksApi, type ApiTask, type CreateTaskPayload } from '../api/tasks';
import { usersApi, type ApiUser } from '../api/users';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useToast } from './ToastContext';

// A task enriched with its assignee's display name, so components never
// have to cross-reference the members list themselves.
export interface UITask extends ApiTask {
  assignee?: { name: string };
}

interface AppState {
  tasks: UITask[];
  members: ApiUser[]; // Admin: every user. Member: empty (they don't need the directory).
  isLoading: boolean;
  error: string | null;

  addTask: (task: CreateTaskPayload) => Promise<void>;
  updateTask: (id: string, updates: Partial<CreateTaskPayload>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Members can only change status on their own tasks; Admins can move any
  // task. Both end up here — the server enforces who's actually allowed.
  moveTask: (taskId: string, newStatus: string) => Promise<void>;
  refetchTasks: () => Promise<void>;
  refetchMembers: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};

function enrich(task: ApiTask, members: ApiUser[]): UITask {
  const assignee = task.assignedTo ? members.find((m) => m.id === task.assignedTo) : undefined;
  return { ...task, assignee: assignee ? { name: assignee.name } : undefined };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { socket, connected } = useSocket();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<UITask[]>([]);
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Socket handlers need the current members list without re-subscribing
  // every time it changes.
  const membersRef = useRef<ApiUser[]>([]);
  membersRef.current = members;

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      // Only an Admin can list every user — a Member just sees themself as
      // their own assignee, which the task payload already implies.
      const [mem, tsk] = await Promise.all([
        user?.role === 'admin' ? usersApi.list() : Promise.resolve<ApiUser[]>([]),
        tasksApi.list(),
      ]);
      setMembers(mem);
      setTasks(tsk.map((t) => enrich(t, mem)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refetch on every REconnect: any change that happened while the socket
  // was down is picked up here, so a dropped connection can't leave the
  // board permanently stale.
  const hasConnectedOnce = useRef(false);
  useEffect(() => {
    if (connected) {
      if (hasConnectedOnce.current) fetchAll();
      hasConnectedOnce.current = true;
    }
  }, [connected, fetchAll]);

  // ── Live updates ──────────────────────────────────────────────────────────
  // The server only sends events this user is entitled to see (admins room /
  // per-user room), so handlers can apply them without re-checking roles.
  useEffect(() => {
    if (!socket) return;

    const onUpsert = ({ task }: { task: ApiTask }) => {
      setTasks((prev) => {
        const enriched = enrich(task, membersRef.current);
        const exists = prev.some((t) => t.id === task.id);
        return exists ? prev.map((t) => (t.id === task.id ? enriched : t)) : [enriched, ...prev];
      });
    };

    const onRemoved = ({ id }: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    const onUserChanged = async () => {
      if (user?.role !== 'admin') return;
      try {
        const mem = await usersApi.list();
        setMembers(mem);
        setTasks((prev) => prev.map((t) => enrich(t, mem)));
      } catch { /* transient — next refetch heals it */ }
    };

    const onNotify = ({ message, kind }: { message: string; kind?: 'info' | 'success' | 'warning' }) => {
      toast(message, kind ?? 'info');
    };

    socket.on('task:upsert', onUpsert);
    socket.on('task:removed', onRemoved);
    socket.on('user:changed', onUserChanged);
    socket.on('notify', onNotify);

    return () => {
      socket.off('task:upsert', onUpsert);
      socket.off('task:removed', onRemoved);
      socket.off('user:changed', onUserChanged);
      socket.off('notify', onNotify);
    };
  }, [socket, user?.role, toast]);

  const refetchTasks = useCallback(async () => {
    const tsk = await tasksApi.list();
    setTasks(tsk.map((t) => enrich(t, membersRef.current)));
  }, []);

  const refetchMembers = useCallback(async () => {
    if (user?.role !== 'admin') return;
    const mem = await usersApi.list();
    setMembers(mem);
  }, [user?.role]);

  // Mutations still apply their result directly — snappier than waiting for
  // the echo of our own socket event, and idempotent when the echo arrives.
  const addTask = useCallback(async (task: CreateTaskPayload) => {
    const newTask = await tasksApi.create(task);
    setTasks((prev) => {
      if (prev.some((t) => t.id === newTask.id)) return prev;
      return [enrich(newTask, membersRef.current), ...prev];
    });
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<CreateTaskPayload>) => {
    const updated = await tasksApi.update(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? enrich(updated, membersRef.current) : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const moveTask = useCallback(async (taskId: string, newStatus: string) => {
    // Optimistic update, then let the server decide who's actually allowed.
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      if (user?.role === 'admin') {
        await tasksApi.update(taskId, { status: newStatus });
      } else {
        await tasksApi.updateStatus(taskId, newStatus);
      }
    } catch (e: any) {
      setError(e.message);
      await refetchTasks();
    }
  }, [user?.role, refetchTasks]);

  return (
    <AppContext.Provider value={{
      tasks, members, isLoading, error,
      addTask, updateTask, deleteTask, moveTask, refetchTasks, refetchMembers,
    }}>
      {children}
    </AppContext.Provider>
  );
};
