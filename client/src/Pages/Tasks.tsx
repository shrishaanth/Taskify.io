import AppSidebar from "../Components/AppSideBar";
import TaskBoard from "../Components/TaskBoard";
import { useAuth } from "../Context/AuthContext";

const Tasks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">
              {isAdmin ? "Tasks" : "My Tasks"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              {isAdmin
                ? "Create, assign, and track every task on the board."
                : "Tasks assigned to you. Drag a card to update its status."}
            </p>
          </header>
          <TaskBoard />
        </div>
      </main>
    </div>
  );
};

export default Tasks;
