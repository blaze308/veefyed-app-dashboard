import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "../assets/modern-dashboard.css";

const ModernDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingVerifications: 0,
    totalReports: 0,
    openTickets: 0,
    totalInsights: 0,
    publishedInsights: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats in parallel
      const [
        reviewsSnap,
        verificationsSnap,
        reportsSnap,
        ticketsSnap,
        insightsSnap,
        publishedInsightsSnap,
      ] = await Promise.all([
        getDocs(collection(db, "reviews")),
        getDocs(query(collection(db, "verification_requests"), where("status", "==", "pending"))),
        getDocs(collection(db, "reports")),
        getDocs(query(collection(db, "support_tickets"), where("status", "in", ["open", "in_progress"]))),
        getDocs(collection(db, "skincare_insights")),
        getDocs(query(collection(db, "skincare_insights"), where("status", "==", "published"))),
      ]);

      setStats({
        totalReviews: reviewsSnap.size,
        pendingVerifications: verificationsSnap.size,
        totalReports: reportsSnap.size,
        openTickets: ticketsSnap.size,
        totalInsights: insightsSnap.size,
        publishedInsights: publishedInsightsSnap.size,
      });

      // Load recent activity
      const recentTickets = await getDocs(
        query(collection(db, "support_tickets"), orderBy("createdAt", "desc"), limit(5))
      );
      
      const activities = recentTickets.docs.map(doc => ({
        id: doc.id,
        type: "ticket",
        ...doc.data(),
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Product Reviews",
      value: stats.totalReviews,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      link: "/reviews",
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      link: "/verification-requests",
      badge: stats.pendingVerifications > 0 ? "Action Required" : null,
    },
    {
      title: "Support Tickets",
      value: stats.openTickets,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      ),
      link: "/support-tickets",
    },
    {
      title: "Skincare Insights",
      value: stats.totalInsights,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      link: "/insights",
      badge: stats.publishedInsights > 0 ? `${stats.publishedInsights} published` : null,
    },
  ];

  const quickActions = [
    {
      title: "Create Insight",
      description: "Write a new skincare insight",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      link: "/insights/new",
      color: "var(--color-primary)",
      roles: ["admin", "super_admin"],
    },
    {
      title: "Manage Invites",
      description: "Send admin invitations",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      link: "/invites",
      color: "var(--color-secondary)",
      roles: ["super_admin"],
    },
    {
      title: "View Reports",
      description: "Check user reports",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: "/reports",
      color: "var(--color-danger)",
      roles: ["admin", "super_admin", "support"],
    },
    {
      title: "Review Queue",
      description: "Moderate product reviews",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      link: "/reviews",
      color: "var(--color-success)",
      roles: ["admin", "super_admin", "support"],
    },
  ];

  const filteredActions = quickActions.filter(action => 
    action.roles.includes(user?.role)
  );

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="modern-stat-card"
            style={{ textDecoration: 'none' }}
          >
            <div className="modern-stat-icon">
              {stat.icon}
            </div>
            <div className="modern-stat-label">{stat.title}</div>
            <div className="modern-stat-value">{loading ? "..." : stat.value}</div>
            {stat.badge && (
              <div className="modern-stat-change positive">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {stat.badge}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Content Overview Section */}
      <div className="modern-card mb-10">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Content Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {stats.totalReviews}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Reviews
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {stats.totalInsights}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Insights
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {stats.publishedInsights}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Published Insights
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {stats.totalReports}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              User Reports
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-8 flex rounded overflow-hidden">
          <div className="bg-yellow-300" style={{ width: `${stats.totalReviews > 0 ? 40 : 0}%` }}></div>
          <div className="bg-purple-500" style={{ width: `${stats.totalInsights > 0 ? 30 : 0}%` }}></div>
          <div className="bg-green-500" style={{ width: `${stats.publishedInsights > 0 ? 20 : 0}%` }}></div>
          <div className="bg-red-500" style={{ width: `${stats.totalReports > 0 ? 10 : 0}%` }}></div>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Insights</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Published</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Reports</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <div className="modern-card">
            <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {filteredActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="p-4 border rounded transition-all hover:bg-gray-50"
                  style={{ 
                    textDecoration: 'none',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded flex-shrink-0"
                      style={{ 
                        background: 'var(--color-bg-tertiary)',
                      }}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {action.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {action.description}
                      </p>
                    </div>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div>
              <h2 className="modern-card-title">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                System Status
              </h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Authentication
                </span>
              </div>
              <span className="modern-badge modern-badge-success text-xs">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Database
                </span>
              </div>
              <span className="modern-badge modern-badge-success text-xs">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Storage
                </span>
              </div>
              <span className="modern-badge modern-badge-success text-xs">Ready</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Invite System
                </span>
              </div>
              <span className="modern-badge modern-badge-success text-xs">Ready</span>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Role
            </div>
            <div className="flex items-center gap-2">
              <span className="modern-badge modern-badge-info">
                {user?.role === "super_admin"
                  ? "Super Administrator"
                  : user?.role === "admin"
                  ? "Administrator"
                  : "Support Staff"}
              </span>
            </div>
            {user?.role === "super_admin" && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                ✨ Full system access
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="mt-6">
          <div className="modern-card">
            <div className="modern-card-header">
              <div>
                <h2 className="modern-card-title">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity
                </h2>
                <p className="modern-card-subtitle">Latest support tickets</p>
              </div>
              <Link to="/support-tickets" className="modern-btn modern-btn-ghost modern-btn-sm">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {activity.subject || "Support Ticket"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {activity.userEmail || "Unknown user"}
                    </p>
                  </div>
                  <span className={`modern-badge modern-badge-${
                    activity.status === "open" ? "warning" :
                    activity.status === "in_progress" ? "info" :
                    activity.status === "resolved" ? "success" : "neutral"
                  } text-xs`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDashboard;

