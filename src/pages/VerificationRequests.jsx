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
  VerificationRequest,
  VerificationStatus,
  getStatusColor,
} from "../models/VerificationRequest";
import { userService } from "../services/userService";

const VerificationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userDetails, setUserDetails] = useState({}); // Store fetched user details

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "verification_requests"),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map((doc) =>
        VerificationRequest.fromFirestore(doc)
      );

      // Extract unique user IDs from requests
      const userIds = [
        ...new Set(
          requestsData.map((request) => request.userId).filter(Boolean)
        ),
      ];

      // Fetch user details for all users
      if (userIds.length > 0) {
        const fetchedUserDetails = await userService.getUsersByIds(userIds);
        setUserDetails(fetchedUserDetails);
      }

      setRequests(requestsData);
    } catch (error) {
      console.error("Error loading verification requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, notes = "") => {
    try {
      const statusValue =
        typeof newStatus === "string" ? newStatus : newStatus.value;

      await updateDoc(doc(db, "verification_requests", requestId), {
        status: statusValue,
        adminNotes: notes,
        updatedAt: new Date(),
        reviewedBy: user?.uid,
      });

      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? request.copyWith({
                status: VerificationStatus.fromString(statusValue),
                adminNotes: notes,
                updatedAt: new Date(),
              })
            : request
        )
      );

      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating verification request:", error);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filter === "all") return true;
    return request.status.value === filter;
  });

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case "all":
        return requests.length;
      case "approved":
        return requests.filter((r) => r.status.value === "approved").length;
      case "pending":
        return requests.filter((r) => r.status.value === "pending").length;
      case "rejected":
        return requests.filter((r) => r.status.value === "rejected").length;
      default:
        return 0;
    }
  };

  // Remove the local getStatusColor function since we're importing it from the model

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
        <h1 className="text-2xl font-bold text-gray-900">
          Verification Requests
        </h1>
        <p className="text-gray-600">
          Review and manage user verification requests
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

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length === 0 ? (
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
              No verification requests found
            </h3>
            <p className="text-gray-500">
              No requests match the current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store & Location
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.ticketNumber || `#${request.id?.slice(-8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {userDetails[request.userId]?.photoURL ? (
                            <img
                              src={userDetails[request.userId].photoURL}
                              alt="User avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-white">
                              {userService.getInitials(
                                userDetails[request.userId]
                              )}
                            </span>
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {userService.getPreferredName(
                              userDetails[request.userId]
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {userDetails[request.userId]?.email ||
                              request.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {request.productName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.brandName} • {request.category}
                      </div>
                      <div className="text-sm text-gray-500">
                        Batch: {request.batchNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.storeName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.country} ({request.countryCode})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          request.status.value
                        )}`}
                      >
                        {request.status.displayName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.formattedCreatedAt.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                        {user?.role !== "support" && (
                          <>
                            {/* Show Approve button if not approved */}
                            {request.status.value !== "approved" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    request.id,
                                    VerificationStatus.APPROVED.value
                                  )
                                }
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                            )}
                            {/* Show Reject button if not rejected */}
                            {request.status.value !== "rejected" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    request.id,
                                    VerificationStatus.REJECTED.value
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
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Verification Request Details
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Request Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Request Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Ticket Number:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.ticketNumber ||
                            `#${selectedRequest.id?.slice(-8)}`}
                        </span>
                      </div>

                      {/* User Information Section */}
                      <div className="bg-white p-3 rounded-lg space-y-2 mt-3">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                            {userDetails[selectedRequest.userId]?.photoURL ? (
                              <img
                                src={
                                  userDetails[selectedRequest.userId].photoURL
                                }
                                alt="User avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium text-white">
                                {userService.getInitials(
                                  userDetails[selectedRequest.userId]
                                )}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {userService.getPreferredName(
                                userDetails[selectedRequest.userId]
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {userDetails[selectedRequest.userId]?.email ||
                                selectedRequest.userEmail}
                            </p>
                          </div>
                        </div>

                        {userDetails[selectedRequest.userId]?.fullName && (
                          <p>
                            <span className="font-medium">Full Name:</span>{" "}
                            {userDetails[selectedRequest.userId].fullName}
                          </p>
                        )}
                        {userDetails[selectedRequest.userId]?.displayName && (
                          <p>
                            <span className="font-medium">Display Name:</span>{" "}
                            {userDetails[selectedRequest.userId].displayName}
                          </p>
                        )}
                        {userDetails[selectedRequest.userId]?.country && (
                          <p>
                            <span className="font-medium">User Location:</span>{" "}
                            {userDetails[selectedRequest.userId].city
                              ? `${userDetails[selectedRequest.userId].city}, `
                              : ""}
                            {userDetails[selectedRequest.userId].country}
                          </p>
                        )}
                        {userDetails[selectedRequest.userId]
                          ?.registrationMethod && (
                          <p>
                            <span className="font-medium">Registration:</span>{" "}
                            <span className="capitalize">
                              {
                                userDetails[selectedRequest.userId]
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
                            selectedRequest.status.value
                          )}`}
                        >
                          {selectedRequest.status.displayName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Submitted:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.formattedCreatedAt.full}
                        </span>
                      </div>
                      {selectedRequest.updatedAt && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Last Updated:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {selectedRequest.formattedUpdatedAt.full}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Product Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Product Name:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.productName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Brand:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.brandName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Category:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.category}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Barcode:
                        </span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">
                          {selectedRequest.barcode}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Batch Number:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.batchNumber}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Store:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.storeName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Location:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedRequest.country} (
                          {selectedRequest.countryCode})
                        </span>
                      </div>
                      {selectedRequest.additionalNotes && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Additional Notes:
                          </span>
                          <div className="ml-2 mt-1 p-2 bg-white rounded text-gray-900">
                            {selectedRequest.additionalNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRequest.adminNotes && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Admin Notes
                      </h4>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.adminNotes}
                      </div>
                    </div>
                  )}

                  {selectedRequest.verificationResult && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Verification Result
                      </h4>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.verificationResult}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Images */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Product Images
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { url: selectedRequest.frontImageUrl, label: "Front" },
                        { url: selectedRequest.sideImageUrl, label: "Side" },
                        { url: selectedRequest.backImageUrl, label: "Back" },
                        {
                          url: selectedRequest.topBottomImageUrl,
                          label: "Top/Bottom",
                        },
                        {
                          url: selectedRequest.batchNumberImageUrl,
                          label: "Batch Number",
                        },
                      ].map((image, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs font-medium text-gray-700 mb-1">
                            {image.label}
                          </div>
                          {image.url ? (
                            <img
                              src={image.url}
                              alt={image.label}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-75"
                              onClick={() => window.open(image.url, "_blank")}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-200 rounded border flex items-center justify-center">
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

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                {user?.role !== "support" && (
                  <>
                    {/* Show Approve button if not approved */}
                    {selectedRequest.status.value !== "approved" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            selectedRequest.id,
                            VerificationStatus.APPROVED.value,
                            "Approved after review"
                          )
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                    {/* Show Reject button if not rejected */}
                    {selectedRequest.status.value !== "rejected" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            selectedRequest.id,
                            VerificationStatus.REJECTED.value,
                            "Rejected after review"
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

export default VerificationRequests;
