import React from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Role-based access control component
 * Renders children only if user has required role/permission
 */
const RoleGuard = ({
  children,
  requiredRole = null,
  allowedRoles = [],
  requireSuperAdmin = false,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, don't render anything
  if (!isAuthenticated || !user) {
    return fallback;
  }

  // Check for super admin requirement
  if (requireSuperAdmin) {
    if (user.role !== "super_admin") {
      return fallback;
    }
  }

  // Check for specific required role
  if (requiredRole) {
    if (user.role !== requiredRole) {
      return fallback;
    }
  }

  // Check if user role is in allowed roles
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return fallback;
    }
  }

  // If all checks pass, render children
  return children;
};

export default RoleGuard;
