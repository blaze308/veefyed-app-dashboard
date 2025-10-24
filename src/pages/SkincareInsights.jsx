import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SchedulingService from "../services/schedulingService";
import ArticleModal from "../components/ArticleModal";
import MobileInsightCard from "../components/MobileInsightCard";
import {
  SkincareInsight,
  STATUS_OPTIONS,
  CATEGORIES,
  CONTENT_TYPES,
} from "../models/SkincareInsight";

const SkincareInsights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    isActive: "",
    isDeleted: "false", // Default to show only non-deleted items
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadInsights();
    // Check for scheduled insights when component mounts
    SchedulingService.checkScheduledInsights().then((publishedCount) => {
      if (publishedCount > 0) {
        // Reload insights if any were published
        setTimeout(() => loadInsights(), 1000);
      }
    });
  }, [filters]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError("");

      const options = {
        orderByField: "updatedAt",
        orderDirection: "desc",
      };

      let insightsData;

      if (filters.status) {
        insightsData = await SkincareInsight.getByStatus(
          filters.status,
          options
        );
      } else {
        insightsData = await SkincareInsight.getAll(options);
      }

      // Apply additional filters
      if (filters.category) {
        insightsData = insightsData.filter(
          (insight) => insight.category === filters.category
        );
      }

      if (filters.isActive !== "") {
        const isActiveFilter = filters.isActive === "true";
        insightsData = insightsData.filter(
          (insight) => insight.isActive === isActiveFilter
        );
      }

      if (filters.isDeleted !== "") {
        const isDeletedFilter = filters.isDeleted === "true";
        insightsData = insightsData.filter(
          (insight) => (insight.isDeleted || false) === isDeletedFilter
        );
      }

      setInsights(insightsData);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError("Failed to load insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (insight) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${insight.title}"? This will hide it from users but keep it in the system.`
      )
    ) {
      return;
    }

    try {
      await insight.softDelete();
      // Reload insights to reflect the change
      loadInsights();
    } catch (err) {
      console.error("Error deleting insight:", err);
      setError("Failed to delete insight. Please try again.");
    }
  };

  const handleRestore = async (insight) => {
    if (
      !window.confirm(`Are you sure you want to restore "${insight.title}"?`)
    ) {
      return;
    }

    try {
      await insight.restore();
      // Reload insights to reflect the change
      loadInsights();
    } catch (err) {
      console.error("Error restoring insight:", err);
      setError("Failed to restore insight. Please try again.");
    }
  };

  const handleToggleActive = async (insight) => {
    try {
      insight.isActive = !insight.isActive;
      insight.updatedBy = user.uid;
      await insight.save();

      // Update local state
      setInsights(insights.map((i) => (i.id === insight.id ? insight : i)));
    } catch (err) {
      console.error("Error updating insight:", err);
      setError("Failed to update insight status. Please try again.");
    }
  };

  const filteredInsights = insights.filter(
    (insight) =>
      insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "published":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "draft":
        return (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "scheduled":
        return (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "archived":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleViewInsight = (insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInsight(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Skincare Insights
            </h1>
            <p className="text-gray-600 mt-1">
              Manage skincare insights and videos for the mobile app
            </p>
          </div>
          <Link
            to="/skincare-insights/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
          >
            ✨ Create New Insight
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Deleted Filter */}
          <select
            value={filters.isDeleted}
            onChange={(e) =>
              setFilters({ ...filters, isDeleted: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="false">Active Items</option>
            <option value="true">Deleted Items</option>
            <option value="">All Items</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading insights...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insight
                    </th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="w-32 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInsights.map((insight) => (
                    <tr
                      key={insight.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewInsight(insight)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {(() => {
                            // Get first available media (image or video thumbnail)
                            let mediaUrl = null;
                            let isVideo = false;

                            // Check for images first
                            if (insight.thumbnailUrl) mediaUrl = insight.thumbnailUrl;
                            else if (insight.imageUrl) mediaUrl = insight.imageUrl;
                            else if (insight.image_urls && insight.image_urls.length > 0) mediaUrl = insight.image_urls[0];
                            else if (insight.images && insight.images.length > 0 && insight.images[0].url) mediaUrl = insight.images[0].url;
                            
                            // If no images, check for video thumbnails
                            if (!mediaUrl) {
                              if (insight.videos && insight.videos.length > 0) {
                                const firstVideo = insight.videos[0];
                                if (firstVideo.thumbnail) {
                                  mediaUrl = firstVideo.thumbnail;
                                  isVideo = true;
                                } else if (firstVideo.type === "youtube") {
                                  const videoId = firstVideo.url.match(
                                    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
                                  )?.[1];
                                  if (videoId) {
                                    mediaUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                                    isVideo = true;
                                  }
                                }
                              } else if (insight.videoUrl) {
                                const videoId = insight.videoUrl.match(
                                  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
                                )?.[1];
                                if (videoId) {
                                  mediaUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                                  isVideo = true;
                                }
                              }
                            }

                            const hasVideoContent = insight.videoUrl || 
                              (insight.video_urls && insight.video_urls.length > 0) ||
                              (insight.videos && insight.videos.length > 0);

                            return mediaUrl ? (
                              <div className="relative">
                                <img
                                  src={mediaUrl}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                                {(isVideo || hasVideoContent) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black bg-opacity-50 rounded-full p-1">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                {hasVideoContent ? (
                                  <svg
                                    className="w-6 h-6 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-6 h-6 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {insight.title}
                              </h3>
                              {insight.isFeatured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Featured
                                </span>
                              )}
                              {/* Media indicators */}
                              {(insight.imageUrl ||
                                insight.videoUrl ||
                                (insight.images && insight.images.length > 0) ||
                                (insight.videos &&
                                  insight.videos.length > 0)) && (
                                <div className="flex gap-1">
                                  {(insight.imageUrl ||
                                    (insight.images &&
                                      insight.images.length > 0)) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      📷{" "}
                                      {insight.images
                                        ? insight.images.length
                                        : 1}
                                    </span>
                                  )}
                                  {(insight.videoUrl ||
                                    (insight.videos &&
                                      insight.videos.length > 0)) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      🎥{" "}
                                      {insight.videos
                                        ? insight.videos.length
                                        : 1}
                                    </span>
                                  )}
                                </div>
                              )}
                              {insight.isDeleted && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Deleted
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {insight.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{insight.getReadTimeText()}</span>
                              <span>•</span>
                              <span className="capitalize">
                                {insight.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {insight.author}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {insight.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(insight.status)}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${insight.getStatusBadgeColor()}`}
                          >
                            {insight.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>👁 {insight.viewCount}</div>
                          <div>❤️ {insight.likeCount}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {insight.updatedAt
                          ? insight.updatedAt.toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!insight.isDeleted && (
                            <Link
                              to={`/skincare-insights/${insight.id}/edit`}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </Link>
                          )}
                          {insight.isDeleted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(insight);
                              }}
                              className="text-green-600 hover:text-green-900 transition-colors"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(insight);
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredInsights.map((insight) => (
              <MobileInsightCard
                key={insight.id}
                insight={insight}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onView={handleViewInsight}
              />
            ))}
          </div>
          {filteredInsights.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No insights found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || Object.values(filters).some((f) => f)
                  ? "Try adjusting your search or filters."
                  : "Get started by creating your first skincare insight."}
              </p>
              {!searchTerm && !Object.values(filters).some((f) => f) && (
                <div className="mt-6">
                  <Link
                    to="/skincare-insights/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create New Insight
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Summary Stats */}
          {filteredInsights.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {filteredInsights.length}
                </div>
                <div className="text-sm text-gray-500">Total Insights</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-2xl font-bold text-green-600">
                  {
                    filteredInsights.filter((i) => i.status === "published")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-500">Published</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {filteredInsights.filter((i) => i.status === "draft").length}
                </div>
                <div className="text-sm text-gray-500">Drafts</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    filteredInsights.filter(
                      (i) =>
                        i.imageUrl ||
                        i.videoUrl ||
                        (i.images && i.images.length > 0) ||
                        (i.videos && i.videos.length > 0)
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-500">With Media</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Article Modal */}
      <ArticleModal
        insight={selectedInsight}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default SkincareInsights;
