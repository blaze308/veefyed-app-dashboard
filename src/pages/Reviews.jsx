import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import { ReviewStatus, getStatusColor } from "../models/Review";
import { userService } from "../services/userService";

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedReview, setSelectedReview] = useState(null);
  const [userDetails, setUserDetails] = useState({}); // Store fetched user details

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle different date formats - could be Firestore Timestamp or ISO string
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
            ? new Date(data.createdAt)
            : new Date(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt
            ? new Date(data.updatedAt)
            : null,
          // Ensure status field exists, default to pending
          status: data.status
            ? ReviewStatus.fromString(data.status)
            : ReviewStatus.PENDING,
        };
      });

      // Extract unique user IDs from reviews
      const userIds = [
        ...new Set(reviewsData.map((review) => review.userId).filter(Boolean)),
      ];

      // Fetch user details for all users
      if (userIds.length > 0) {
        const fetchedUserDetails = await userService.getUsersByIds(userIds);
        setUserDetails(fetchedUserDetails);
      }

      setReviews(reviewsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProductRating = async (productId) => {
    try {
      // Get all approved reviews for this product
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        where("status", "==", "approved")
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);

      // Calculate new rating and count
      let totalRating = 0;
      let reviewCount = 0;

      reviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        totalRating += review.rating;
        reviewCount++;
      });

      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // Update the product document
      await updateDoc(doc(db, "catalog", productId), {
        rating: averageRating,
        review_count: reviewCount,
        updated_at: new Date().toISOString(),
      });

      console.log(
        `Product ${productId} rating updated: ${averageRating} (${reviewCount} reviews)`
      );
    } catch (error) {
      console.error("Error updating product rating:", error);
      throw error;
    }
  };

  const handleStatusUpdate = async (reviewId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid,
      };

      // Get the review data first to get the product ID
      const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
      if (!reviewDoc.exists()) {
        throw new Error("Review not found");
      }

      const reviewData = reviewDoc.data();
      const productId = reviewData.productId;

      // Update the review status
      await updateDoc(doc(db, "reviews", reviewId), updateData);

      // Update product rating if review is being approved or rejected
      if (productId && (newStatus === "approved" || newStatus === "rejected")) {
        await updateProductRating(productId);
      }

      // Update local state immediately
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                status: ReviewStatus.fromString(newStatus),
                updatedAt: new Date(),
              }
            : review
        )
      );

      // Refresh the reviews list to get the latest data
      await loadReviews();

      console.log(`Review ${reviewId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating review status:", error);
      alert("Failed to update review status. Please try again.");
      
      // Refresh reviews even on error to ensure consistency
      await loadReviews();
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    if (filter === "approved")
      return (
        review.status?.value === "approved" || review.status === "approved"
      );
    if (filter === "rejected")
      return (
        review.status?.value === "rejected" || review.status === "rejected"
      );
    if (filter === "pending")
      return (
        !review.status ||
        review.status?.value === "pending" ||
        review.status === "pending"
      );
    if (filter === "with_images")
      return review.imageUrls && review.imageUrls.length > 0;
    if (filter === "with_effects")
      return review.skinEffects && review.skinEffects.length > 0;
    return false;
  });

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case "all":
        return reviews.length;
      case "approved":
        return reviews.filter(
          (r) => r.status?.value === "approved" || r.status === "approved"
        ).length;
      case "rejected":
        return reviews.filter(
          (r) => r.status?.value === "rejected" || r.status === "rejected"
        ).length;
      case "pending":
        return reviews.filter(
          (r) =>
            !r.status || r.status?.value === "pending" || r.status === "pending"
        ).length;
      case "with_images": {
        const withImagesCount = reviews.filter(
          (r) => r.imageUrls && r.imageUrls.length > 0
        ).length;
        return withImagesCount;
      }
      case "with_effects":
        return reviews.filter((r) => r.skinEffects && r.skinEffects.length > 0)
          .length;
      default:
        return 0;
    }
  };

  const getRatingStars = (rating) => {
    const numRating = parseFloat(rating) || 0;

    return Array.from({ length: 5 }, (_, i) => {
      const starPosition = i + 1;
      let starClass = "text-gray-300"; // Default empty star
      let fillType = "currentColor";

      if (numRating >= starPosition) {
        // Full star
        starClass = "text-yellow-400";
      } else if (numRating > i) {
        // Partial star - we'll use a gradient or half-filled effect
        starClass = "text-yellow-400";
        const percentage = ((numRating - i) * 100).toFixed(0);

        return (
          <div key={i} className="relative w-4 h-4">
            {/* Background (empty) star */}
            <svg
              className="absolute w-4 h-4 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {/* Partial fill */}
            <div
              className="absolute overflow-hidden"
              style={{ width: `${percentage}%` }}
            >
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        );
      }

      return (
        <svg
          key={i}
          className={`w-4 h-4 ${starClass}`}
          fill={fillType}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
        <p className="text-gray-600">
          Manage customer product reviews and ratings
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: "pending", label: "Pending" },
          { key: "with_images", label: "With Images" },
          { key: "with_effects", label: "With Effects" },
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

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredReviews.length === 0 ? (
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No reviews found
            </h3>
            <p className="text-gray-500">
              No reviews match the current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {user?.role !== "support" && (
                    <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {userDetails[review.userId]?.photoURL ? (
                            <img
                              src={userDetails[review.userId].photoURL}
                              alt="User avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-white">
                              {userService.getInitials(
                                userDetails[review.userId]
                              )}
                            </span>
                          )}
                        </div>
                        <div className="ml-2 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {userService.getPreferredName(
                              userDetails[review.userId]
                            )}
                          </div>
                          {userService.getCountryandCity(
                            review.userId,
                            userDetails
                          ) && (
                            <div className="text-xs text-gray-500 truncate">
                              {userService.getCountryandCity(
                                review.userId,
                                userDetails
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 font-medium truncate">
                        {review.productName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {review.brandName} • {review.category}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRatingStars(review.rating || 0)}
                        <span className="ml-1 text-xs text-gray-600">
                          {review.rating || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <p
                          className="line-clamp-2 cursor-pointer hover:text-blue-600"
                          onClick={() => setSelectedReview(review)}
                          title={review.comment || "No comment"}
                        >
                          {review.comment || "No comment"}
                        </p>
                        {review.skinEffects &&
                          review.skinEffects.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1 truncate">
                              Effects:{" "}
                              {review.skinEffects.slice(0, 2).join(", ")}
                              {review.skinEffects.length > 2 && "..."}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          review.status?.value || review.status || "pending"
                        )}`}
                      >
                        {review.status?.displayName ||
                          (review.status === "approved"
                            ? "Approved"
                            : review.status === "rejected"
                            ? "Rejected"
                            : "Pending")}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      {review.createdAt.toLocaleDateString()}
                    </td>
                    {user?.role !== "support" && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-md transition-colors duration-200"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View
                          </button>
                          {user?.role !== "support" && (
                            <>
                              {/* Show Approve button if not approved */}
                              {!(
                                review.status?.value === "approved" ||
                                review.status === "approved"
                              ) && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(review.id, "approved")
                                  }
                                  className="inline-flex items-center px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-md transition-colors duration-200"
                                >
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Approve
                                </button>
                              )}
                              {/* Show Reject button if not rejected */}
                              {!(
                                review.status?.value === "rejected" ||
                                review.status === "rejected"
                              ) && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(review.id, "rejected")
                                  }
                                  className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-md transition-colors duration-200"
                                >
                                  <svg
                                    className="w-3 h-3 mr-1"
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
                                  Reject
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review Details
                </h3>
                <button
                  onClick={() => setSelectedReview(null)}
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
                {/* User Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      User Information
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                          {userDetails[selectedReview.userId]?.photoURL ? (
                            <img
                              src={userDetails[selectedReview.userId].photoURL}
                              alt="User avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-medium text-white">
                              {userService.getInitials(
                                userDetails[selectedReview.userId]
                              )}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {userService.getPreferredName(
                              userDetails[selectedReview.userId]
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {userDetails[selectedReview.userId]?.email ||
                              "Email not available"}
                          </p>
                        </div>
                      </div>

                      {userDetails[selectedReview.userId]?.fullName && (
                        <p>
                          <span className="font-medium">Full Name:</span>{" "}
                          {userDetails[selectedReview.userId].fullName}
                        </p>
                      )}
                      {userDetails[selectedReview.userId]?.displayName && (
                        <p>
                          <span className="font-medium">Display Name:</span>{" "}
                          {userDetails[selectedReview.userId].displayName}
                        </p>
                      )}
                      {userDetails[selectedReview.userId]?.ageGroup && (
                        <p>
                          <span className="font-medium">Age Group:</span>{" "}
                          {userDetails[selectedReview.userId].ageGroup}
                        </p>
                      )}
                      {userDetails[selectedReview.userId]?.gender && (
                        <p>
                          <span className="font-medium">Gender:</span>{" "}
                          {userDetails[selectedReview.userId].gender}
                        </p>
                      )}
                      {userDetails[selectedReview.userId]?.country && (
                        <p>
                          <span className="font-medium">Location:</span>{" "}
                          {userDetails[selectedReview.userId].city
                            ? `${userDetails[selectedReview.userId].city}, `
                            : ""}
                          {userDetails[selectedReview.userId].country}
                        </p>
                      )}
                      {userDetails[selectedReview.userId]
                        ?.registrationMethod && (
                        <p>
                          <span className="font-medium">Registration:</span>{" "}
                          <span className="capitalize">
                            {
                              userDetails[selectedReview.userId]
                                .registrationMethod
                            }
                          </span>
                        </p>
                      )}
                      {userDetails[selectedReview.userId]?.emailVerified && (
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-green-600 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm text-green-700">
                            Email Verified
                          </span>
                        </div>
                      )}
                      {userDetails[selectedReview.userId]?.signUpForUpdates && (
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-blue-600 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm text-blue-700">
                            Subscribed to Updates
                          </span>
                        </div>
                      )}
                      {userDetails[selectedReview.userId]?.savedProducts &&
                        userDetails[selectedReview.userId].savedProducts
                          .length > 0 && (
                          <p>
                            <span className="font-medium">Saved Products:</span>{" "}
                            <span className="text-sm text-gray-600">
                              {
                                userDetails[selectedReview.userId].savedProducts
                                  .length
                              }{" "}
                              items saved
                            </span>
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Product Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Product Information
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <p>
                        <span className="font-medium">Product:</span>{" "}
                        {selectedReview.productName}
                      </p>
                      <p>
                        <span className="font-medium">Brand:</span>{" "}
                        {selectedReview.brandName}
                      </p>
                      <p>
                        <span className="font-medium">Category:</span>{" "}
                        {selectedReview.category}
                      </p>
                      <p>
                        <span className="font-medium">Product ID:</span>{" "}
                        {selectedReview.productId}
                      </p>
                      {selectedReview.productDetails &&
                        Object.keys(selectedReview.productDetails).length >
                          0 && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-600">
                              Additional Product Details:
                            </span>
                            <div className="mt-1 text-xs text-gray-700 space-y-1">
                              {Object.entries(selectedReview.productDetails)
                                .filter(
                                  ([key]) =>
                                    !key.toLowerCase().includes("url") &&
                                    !key.toLowerCase().includes("image")
                                )
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium capitalize">
                                      {key.replace(/([A-Z])/g, " $1")}:
                                    </span>{" "}
                                    {String(value)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Usage Information */}
                  {selectedReview.usedWithOtherProduct && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Usage Information
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">
                            Used with other product:
                          </span>{" "}
                          Yes
                        </p>
                        {selectedReview.otherProductName && (
                          <p>
                            <span className="font-medium">Other product:</span>{" "}
                            {selectedReview.otherProductName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="space-y-4">
                  {/* Rating and Comment */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Review
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Rating:</span>
                        {getRatingStars(selectedReview.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {selectedReview.rating}/5
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Comment:</span>
                        <p className="mt-1 text-gray-900">
                          {selectedReview.comment}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Effects and Results */}
                  {(selectedReview.skinEffects?.length > 0 ||
                    selectedReview.longTermEffects?.length > 0) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Effects & Results
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        {selectedReview.skinEffects?.length > 0 && (
                          <div>
                            <span className="font-medium">Skin Effects:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedReview.skinEffects.map(
                                (effect, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                  >
                                    {effect}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {selectedReview.longTermEffects?.length > 0 && (
                          <div>
                            <span className="font-medium">
                              Long-term Effects:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedReview.longTermEffects.map(
                                (effect, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                                  >
                                    {effect}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {selectedReview.timeToResults && (
                          <p>
                            <span className="font-medium">
                              Time to see results:
                            </span>{" "}
                            {selectedReview.timeToResults}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {selectedReview.imageUrls?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Review Images ({selectedReview.imageUrls.length})
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          {selectedReview.imageUrls.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="relative group"
                              style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`Review image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer transition-transform duration-200 group-hover:scale-105 shadow-sm"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onClick={() => window.open(imageUrl, "_blank")}
                                onError={(e) => {
                                  console.error(
                                    "Image failed to load (likely CORS issue):",
                                    imageUrl
                                  );
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                                onLoad={(e) => {
                                  console.log(
                                    "Image loaded successfully:",
                                    imageUrl,
                                    "Natural dimensions:",
                                    e.target.naturalWidth,
                                    "x",
                                    e.target.naturalHeight,
                                    "Display dimensions:",
                                    e.target.width,
                                    "x",
                                    e.target.height
                                  );
                                }}
                              />
                              <div
                                className="absolute inset-0 bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-xs"
                                style={{ display: "none" }}
                              >
                                <div className="text-center">
                                  <svg
                                    className="w-8 h-8 mx-auto mb-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div>Image unavailable</div>
                                  <div className="text-xs mt-1">
                                    (CORS restriction)
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Click on any image to view in full size
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {selectedReview.createdAt.toLocaleDateString()} at{" "}
                    {selectedReview.createdAt.toLocaleTimeString()}
                  </div>
                  {selectedReview.updatedAt && (
                    <div>
                      <span className="font-medium">Updated:</span>{" "}
                      {selectedReview.updatedAt.toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedReview.status?.value ||
                          selectedReview.status ||
                          "pending"
                      )}`}
                    >
                      {selectedReview.status?.displayName ||
                        (selectedReview.status === "approved"
                          ? "Approved"
                          : selectedReview.status === "rejected"
                          ? "Rejected"
                          : "Pending")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Feedback */}
              {selectedReview.feedback && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Admin Feedback
                  </h4>
                  <p className="text-gray-900">{selectedReview.feedback}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Close
                </button>

                {user?.role !== "support" && (
                  <div className="flex space-x-3">
                    {!(
                      selectedReview.status?.value === "approved" ||
                      selectedReview.status === "approved"
                    ) && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedReview.id, "approved");
                          setSelectedReview(null);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve Review
                      </button>
                    )}
                    {/* Show Reject button if not rejected */}
                    {!(
                      selectedReview.status?.value === "rejected" ||
                      selectedReview.status === "rejected"
                    ) && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedReview.id, "rejected");
                          setSelectedReview(null);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Reject Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
