import AppSidebar from "../Components/AppSideBar";
import DashboardStats from "../Components/DashboardStats";
import ActivityFeed from "../Components/ActivityFeed";
import { useAuth } from "../Context/AuthContext";

const Index = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              {isAdmin ? "An overview of your team's tasks." : "An overview of your tasks."}
            </p>
          </header>
          <DashboardStats />
          <div className="mt-6">
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
