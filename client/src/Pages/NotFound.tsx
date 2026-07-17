import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-sm text-gray-600">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
