import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import DashboardLayout from "./components/Layout/DashboardLayout";
import Signin from "./pages/ModernSignin";
import Signup from "./pages/Signup";
import Dashboard from "./pages/ModernDashboard"; 
import Reviews from "./pages/Reviews";
import VerificationRequests from "./pages/VerificationRequests";
import Reports from "./pages/Reports";
import InviteManagement from "./pages/InviteManagement";
import Insights from "./pages/SkincareInsights";
import InsightForm from "./pages/SkincareInsightForm";
import SupportTickets from "./pages/SupportTickets";
import Support from "./pages/Support";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/support" element={<Support />} />

            {/* Protected Routes with Sidebar Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard
                    allowedRoles={["admin", "super_admin", "support"]}
                    fallback={
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                            <div className="mb-4">
                              <svg
                                className="w-16 h-16 text-red-500 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 19.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                              Access Denied
                            </h2>
                            <p className="text-gray-600 mb-4">
                              Administrator privileges required to access the
                              dashboard.
                            </p>
                            <p className="text-sm text-gray-500">
                              Contact a super admin to get invited to the admin
                              panel.
                            </p>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <Reviews />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/verification-requests"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <VerificationRequests />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <Reports />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invites"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["super_admin"]}>
                    <DashboardLayout>
                      <InviteManagement />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <Insights />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights/new"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <InsightForm />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights/:id/edit"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <InsightForm />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            {/* Redirect old routes to new ones */}
            <Route path="/skincare-insights" element={<Navigate to="/insights" replace />} />
            <Route path="/skincare-insights/new" element={<Navigate to="/insights/new" replace />} />
            <Route path="/skincare-insights/:id/edit" element={<Navigate to="/insights/:id/edit" replace />} />
            <Route
              path="/support-tickets"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin", "super_admin", "support"]}>
                    <DashboardLayout>
                      <SupportTickets />
                    </DashboardLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Default redirect to signin */}
            <Route path="/" element={<Navigate to="/signin" replace />} />

            {/* Catch all route - redirect to signin */}
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
