import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  Report,
  ReportStatus,
  ReportType,
  getStatusColor,
  getTypeDisplayName,
} from "../models/Report";
import { userService } from "../services/userService";

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState(null);
  const [userDetails, setUserDetails] = useState({}); // Store fetched user details

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const reportsData = querySnapshot.docs.map((doc) =>
        Report.fromFirestore(doc)
      );

      // Extract unique user IDs from reports
      const userIds = [
        ...new Set(reportsData.map((report) => report.userId).filter(Boolean)),
      ];

      // Fetch user details for all users
      if (userIds.length > 0) {
        const fetchedUserDetails = await userService.getUsersByIds(userIds);
        setUserDetails(fetchedUserDetails);
      }

      setReports(reportsData);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus, notes = "") => {
    try {
      const statusValue =
        typeof newStatus === "string" ? newStatus : newStatus.value;

      const updateData = {
        status: statusValue,
        updatedAt: new Date(),
        reviewedBy: user?.uid,
      };

      if (notes) {
        updateData.adminNotes = notes;
      }

      if (statusValue === "approved") {
        updateData.resolutionDetails = notes || "Report approved by admin";
      }

      await updateDoc(doc(db, "reports", reportId), updateData);

      // Update local state
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? report.copyWith({
                status: ReportStatus.fromString(statusValue),
                adminNotes: notes || report.adminNotes,
                updatedAt: new Date(),
                resolutionDetails:
                  statusValue === "approved"
                    ? notes || "Report approved by admin"
                    : report.resolutionDetails,
              })
            : report
        )
      );

      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true;
    return report.status.value === filter;
  });

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case "all":
        return reports.length;
      case "pending":
        return reports.filter((r) => r.status.value === "pending").length;
      case "approved":
        return reports.filter((r) => r.status.value === "approved").length;
      case "rejected":
        return reports.filter((r) => r.status.value === "rejected").length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">
          Review and manage user-submitted reports
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
          { key: "all", label: "All" },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {filterOption.label} ({getFilterCount(filterOption.key)})
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No reports found
            </h3>
            <p className="text-gray-500">
              No reports match the current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{report.id?.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {userDetails[report.userId]?.photoURL ? (
                            <img
                              src={userDetails[report.userId].photoURL}
                              alt="User avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-white">
                              {userService.getInitials(
                                userDetails[report.userId]
                              )}
                            </span>
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {userService.getPreferredName(
                              userDetails[report.userId]
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {userDetails[report.userId]?.email || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{report.type.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.type.displayName}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {report.reason}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.totalEvidenceCount} files
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.evidenceFiles.length} docs,{" "}
                        {report.evidencePhotos.length} photos
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          report.status.value
                        )}`}
                      >
                        {report.status.displayName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.formattedCreatedAt.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                        {user?.role !== "support" && (
                          <>
                            {/* Show Approve button if not approved */}
                            {report.status.value !== "approved" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    report.id,
                                    ReportStatus.APPROVED.value,
                                    "Report approved"
                                  )
                                }
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                            )}
                            {/* Show Reject button if not rejected */}
                            {report.status.value !== "rejected" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    report.id,
                                    ReportStatus.REJECTED.value,
                                    "Report rejected"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Report Details
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Report Details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Report Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Report ID:
                        </span>
                        <span className="ml-2 text-gray-900">
                          #{selectedReport.id?.slice(-8)}
                        </span>
                      </div>

                      {/* User Information Section */}
                      <div className="bg-white p-3 rounded-lg space-y-2 mt-3">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                            {userDetails[selectedReport.userId]?.photoURL ? (
                              <img
                                src={
                                  userDetails[selectedReport.userId].photoURL
                                }
                                alt="User avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium text-white">
                                {userService.getInitials(
                                  userDetails[selectedReport.userId]
                                )}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {userService.getPreferredName(
                                userDetails[selectedReport.userId]
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {userDetails[selectedReport.userId]?.email ||
                                "Email not available"}
                            </p>
                          </div>
                        </div>

                        {userDetails[selectedReport.userId]?.fullName && (
                          <p>
                            <span className="font-medium">Full Name:</span>{" "}
                            {userDetails[selectedReport.userId].fullName}
                          </p>
                        )}
                        {userDetails[selectedReport.userId]?.country && (
                          <p>
                            <span className="font-medium">Location:</span>{" "}
                            {userDetails[selectedReport.userId].city
                              ? `${userDetails[selectedReport.userId].city}, `
                              : ""}
                            {userDetails[selectedReport.userId].country}
                          </p>
                        )}
                        {userDetails[selectedReport.userId]
                          ?.registrationMethod && (
                          <p>
                            <span className="font-medium">Registration:</span>{" "}
                            <span className="capitalize">
                              {
                                userDetails[selectedReport.userId]
                                  .registrationMethod
                              }
                            </span>
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            selectedReport.status.value
                          )}`}
                        >
                          {selectedReport.status.displayName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Submitted:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedReport.formattedCreatedAt.full}
                        </span>
                      </div>
                      {selectedReport.updatedAt && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Last Updated:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {selectedReport.formattedUpdatedAt.full}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Report Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Report Type:
                        </span>
                        <div className="mt-1 flex items-center">
                          <span className="text-lg mr-2">
                            {selectedReport.type.icon}
                          </span>
                          <span className="text-gray-900">
                            {selectedReport.type.displayName}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Reason:
                        </span>
                        <div className="mt-1 text-gray-900">
                          {selectedReport.reason}
                        </div>
                      </div>
                      {selectedReport.description && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Description:
                          </span>
                          <div className="mt-1 p-2 bg-white rounded text-gray-900">
                            {selectedReport.description}
                          </div>
                        </div>
                      )}
                      {selectedReport.issueReport && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Issue Report:
                          </span>
                          <div className="mt-1 p-2 bg-white rounded text-gray-900">
                            {selectedReport.issueReport}
                          </div>
                        </div>
                      )}
                      {selectedReport.additionalDetails && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Additional Details:
                          </span>
                          <div className="mt-1 p-2 bg-white rounded text-gray-900">
                            {selectedReport.additionalDetails}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedReport.adminNotes && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Admin Notes
                      </h4>
                      <div className="text-sm text-gray-900">
                        {selectedReport.adminNotes}
                      </div>
                    </div>
                  )}

                  {selectedReport.resolutionDetails && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Resolution Details
                      </h4>
                      <div className="text-sm text-gray-900">
                        {selectedReport.resolutionDetails}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Evidence */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Evidence Files
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Documents ({selectedReport.evidenceFiles.length})
                        </span>
                        <div className="mt-1 space-y-1">
                          {selectedReport.evidenceFiles.map((file, index) => (
                            <div key={index} className="flex items-center">
                              <svg
                                className="w-4 h-4 text-gray-500 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 truncate"
                              >
                                Document {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Photos ({selectedReport.evidencePhotos.length})
                        </span>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {selectedReport.evidencePhotos.map((photo, index) => (
                            <div key={index} className="text-center">
                              <div className="text-xs text-gray-600 mb-1">
                                Photo {index + 1}
                              </div>
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={`Evidence ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-75"
                                  onClick={() => window.open(photo, "_blank")}
                                />
                              ) : (
                                <div className="w-full h-20 bg-gray-200 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    No image
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                {user?.role !== "support" && (
                  <>
                    {/* Show Approve button if not approved */}
                    {selectedReport.status.value !== "approved" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            selectedReport.id,
                            ReportStatus.APPROVED.value,
                            "Report approved after review"
                          )
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                    {/* Show Reject button if not rejected */}
                    {selectedReport.status.value !== "rejected" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            selectedReport.id,
                            ReportStatus.REJECTED.value,
                            "Report rejected after review"
                          )
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
