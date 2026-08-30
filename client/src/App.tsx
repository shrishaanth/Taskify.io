import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/primitives/Toast/ToastProvider";
import { AppRoutes } from "./AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}
