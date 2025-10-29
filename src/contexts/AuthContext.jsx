import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize auth service and get initial user state
        const initialUser = await authService.initialize();
        setUser(initialUser);
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Failed to initialize authentication");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
    });

    initializeAuth();

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signInWithEmail(email, password);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signInWithGoogle();
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async (inviteToken) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signUpWithGoogle(inviteToken);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signUpWithEmail(userData);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signUpWithGoogle,
    signUp,
    signOut,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || user?.isAdmin || false,
    isSupport: user?.role === 'support' || user?.role === 'admin' || user?.role === 'super_admin' || user?.isSupport || false,
    isSuperAdmin: user?.role === 'super_admin' || user?.isSuperAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
