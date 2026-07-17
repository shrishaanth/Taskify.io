import { useState, type FormEvent } from "react";
import AppSidebar from "../Components/AppSideBar";
import { useAuth } from "../Context/AuthContext";
import { usersApi } from "../api/users";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [nameError, setNameError] = useState("");

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    setNameStatus("saving");
    setNameError("");
    try {
      await usersApi.updateMe({ name });
      await refreshUser();
      setNameStatus("saved");
    } catch (err: any) {
      setNameStatus("error");
      setNameError(err.message || "Something went wrong");
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwStatus("saving");
    setPwError("");
    try {
      await usersApi.changeMyPassword(passwords.currentPassword, passwords.newPassword);
      setPasswords({ currentPassword: "", newPassword: "" });
      setPwStatus("saved");
    } catch (err: any) {
      setPwStatus("error");
      setPwError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">Profile</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Manage your account</p>
          </header>

          <div className="space-y-4">
            {/* Profile Card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 transition-colors">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                  {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <span className="inline-flex mt-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveName} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Display Name</label>
                  <input value={name} onChange={(e) => { setName(e.target.value); setNameStatus("idle"); }}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <button type="submit" disabled={nameStatus === "saving"}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {nameStatus === "saving" ? "Saving..." : "Save"}
                </button>
              </form>
              {nameStatus === "saved" && <p className="mt-2 text-xs text-green-600 dark:text-green-400">Saved.</p>}
              {nameStatus === "error" && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{nameError}</p>}
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 transition-colors">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Current Password</label>
                  <input required type="password" value={passwords.currentPassword}
                    onChange={(e) => { setPasswords({ ...passwords, currentPassword: e.target.value }); setPwStatus("idle"); }}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">New Password</label>
                  <input required minLength={6} type="password" value={passwords.newPassword}
                    onChange={(e) => { setPasswords({ ...passwords, newPassword: e.target.value }); setPwStatus("idle"); }}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                {pwStatus === "saved" && <p className="text-xs text-green-600 dark:text-green-400">Password updated.</p>}
                {pwStatus === "error" && <p className="text-xs text-red-600 dark:text-red-400">{pwError}</p>}
                <button type="submit" disabled={pwStatus === "saving"}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {pwStatus === "saving" ? "Saving..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-800 p-6 transition-colors">
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-500 mb-4">Sign Out</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sign out</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">You will be redirected to the login page.</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
