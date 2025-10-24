import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import inviteService from "../services/inviteService";
import emailService from "../services/emailService";

const InviteManagement = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "admin",
    department: "Administration",
    expiresInDays: 7,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  // const [emailConfigured, setEmailConfigured] = useState(false);

  // const checkEmailConfiguration = async () => {
  //   const configured = emailService.isConfigured();
  //   setEmailConfigured(configured);
  //   if (!configured) {
  //     console.warn(
  //       "Email service not configured. Emails will use fallback method."
  //     );
  //   }
  // };

  const loadInvites = useCallback(async () => {
    try {
      if (user?.uid) {
        const userInvites = await inviteService.getInvitesByUser(user.uid);
        setInvites(userInvites);
      }
    } catch (error) {
      console.error("Error loading invites:", error);
    }
  }, [user?.uid]);

  const loadStats = useCallback(async () => {
    try {
      if (user?.uid) {
        const inviteStats = await inviteService.getInviteStats(user.uid);
        setStats(inviteStats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadInvites();
    loadStats();
    // checkEmailConfiguration();
  }, [loadInvites, loadStats]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "*Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "*Please enter a valid email address";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "*Full name is required";
    }

    if (!formData.department.trim()) {
      newErrors.department = "*Department is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if user data is available
    if (!user || !user.uid) {
      setErrors({
        general:
          "User information not available. Please refresh and try again.",
      });
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Create the invite token
      const invite = await inviteService.createInvite({
        email: formData.email,
        role: formData.role,
        department: formData.department,
        invitedBy: user.uid,
        invitedByEmail: user.email,
        expiresInDays: parseInt(formData.expiresInDays),
      });

      // Initialize email service
      await emailService.initialize();

      // Send invite email
      const emailResult = await emailService.sendInviteEmail({
        toEmail: formData.email,
        toName: formData.fullName,
        inviteUrl: invite.getInviteUrl(),
        invitedByName: user.fullName || user.displayName || user.email,
        invitedByEmail: user.email,
        role: formData.role,
        department: formData.department,
        expiresAt: invite.expiresAt,
      });

      if (emailResult.success) {
        setMessage(`Invite created and email sent to ${formData.email}`);
      } else {
        setMessage(
          `Invite created successfully. ${
            emailResult.message || "Please send the invite link manually."
          }`
        );
      }

      // Reset form
      setFormData({
        email: "",
        fullName: "",
        role: "admin",
        department: "Administration",
        expiresInDays: 7,
      });

      // Reload data
      loadInvites();
      loadStats();
    } catch (error) {
      console.error("Error creating invite:", error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateInvite = async (inviteId) => {
    if (window.confirm("Are you sure you want to deactivate this invite?")) {
      try {
        await inviteService.deactivateInvite(inviteId);
        setMessage("Invite deactivated successfully");
        loadInvites();
        loadStats();
      } catch (error) {
        console.error("Error deactivating invite:", error);
      }
    }
  };

  const copyInviteLink = (invite) => {
    const url = invite.getInviteUrl();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setMessage("Invite link copied to clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setMessage("Invite link copied to clipboard!");
      });
  };

  const getStatusBadge = (invite) => {
    if (!invite.isActive) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
          Inactive
        </span>
      );
    }
    if (invite.isExpired()) {
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
          Expired
        </span>
      );
    }
    if (invite.usedAt) {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
          Used
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
        Active
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600">
          Create and manage invitation tokens for new team members
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Invites</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.active}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.used}
            </div>
            <div className="text-sm text-gray-500">Used</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <div className="text-sm text-gray-500">Expired</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Invite Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Create New Invite
            </h2>
          </div>

          <div className="p-6">
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                {message}
              </div>
            )}

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${
                    errors.email
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`${
                    errors.fullName
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  placeholder="John Doe"
                  disabled={isLoading}
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Role
                </label>
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                  disabled={isLoading}
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                  {user?.role === "super_admin" && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  id="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`${
                    errors.department
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  placeholder="Administration"
                  disabled={isLoading}
                  required
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="expiresInDays"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Expires In (Days)
                </label>
                <select
                  name="expiresInDays"
                  id="expiresInDays"
                  value={formData.expiresInDays}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                  disabled={isLoading}
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Invite..." : "Create Invite"}
              </button>
            </form>
          </div>
        </div>

        {/* Invites List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Invites
            </h2>
          </div>

          <div className="p-6">
            {invites.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No invites created yet
              </p>
            ) : (
              <div className="space-y-4">
                {invites.slice(0, 10).map((invite) => (
                  <div
                    key={invite.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {invite.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invite.role} • {invite.department}
                        </div>
                      </div>
                      {getStatusBadge(invite)}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Created: {new Date(invite.createdAt).toLocaleDateString()}
                      {invite.usedAt && (
                        <span>
                          {" "}
                          • Used: {new Date(invite.usedAt).toLocaleDateString()}
                        </span>
                      )}
                      <br />
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>

                    <div className="flex space-x-2">
                      {invite.isActive && invite.isValid() && (
                        <button
                          onClick={() => copyInviteLink(invite)}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Copy Link
                        </button>
                      )}
                      {invite.isActive && (
                        <button
                          onClick={() => handleDeactivateInvite(invite.id)}
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteManagement;
