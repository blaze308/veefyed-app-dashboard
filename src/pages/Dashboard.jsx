import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.preferredName}!</p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome, {user?.preferredName}!
            </h3>
            <p className="text-gray-600">
              You're logged in as a{" "}
              {user?.role === "super_admin"
                ? "Super Administrator"
                : user?.role === "admin"
                ? "Administrator"
                : "Support Staff"}
            </p>
            {user?.role === "super_admin" && (
              <p className="text-sm text-blue-600 mt-2">
                ✨ You have full system access and can manage all administrators
              </p>
            )}
          </div>

          {/* System Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              System Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">
                  Authentication: Active
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">
                  Database: Connected
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">
                  Invite System: Ready
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
              {user?.role === "support" && (
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  (View Only)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Management */}
              <div
                className={`p-4 border border-gray-200 rounded-lg ${
                  user?.role === "support"
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">Users</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.role === "support"
                    ? "View app users"
                    : "Manage app users and accounts"}
                </p>
              </div>

              {/* Product Management */}
              <div
                className={`p-4 border border-gray-200 rounded-lg ${
                  user?.role === "support"
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">Products</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.role === "support"
                    ? "View product listings"
                    : "Manage product listings"}
                </p>
              </div>

              {/* Reviews Management */}
              <div
                className={`p-4 border border-gray-200 rounded-lg ${
                  user?.role === "support"
                    ? "hover:bg-gray-50 cursor-pointer"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-yellow-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">Reviews</span>
                </div>
                <p className="text-sm text-gray-600">Moderate user reviews</p>
              </div>

              {/* Analytics */}
              <div
                className={`p-4 border border-gray-200 rounded-lg ${
                  user?.role === "support"
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-purple-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">Analytics</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.role === "support"
                    ? "View system data"
                    : "View system analytics"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
