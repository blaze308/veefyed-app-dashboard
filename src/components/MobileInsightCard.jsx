import React from "react";
import { Link } from "react-router-dom";

const MobileInsightCard = ({ insight, onDelete, onRestore, onView }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "published":
        return <span className="text-green-500">✓</span>;
      case "draft":
        return <span className="text-gray-500">📝</span>;
      default:
        return null;
    }
  };

  const getMediaCount = () => {
    let imageCount = 0;
    let videoCount = 0;

    // Count legacy media
    if (insight.imageUrl) imageCount += 1;
    if (insight.videoUrl) videoCount += 1;

    // Count new media arrays
    if (insight.images) imageCount += insight.images.length;
    if (insight.videos) videoCount += insight.videos.length;

    // Count URL arrays (new structure)
    if (insight.image_urls) imageCount += insight.image_urls.length;
    if (insight.video_urls) videoCount += insight.video_urls.length;

    return { imageCount, videoCount };
  };

  const getFirstMediaUrl = () => {
    // Priority order for thumbnail:
    // 1. Featured image (always highest priority)
    // 2. Explicit thumbnail URL
    // 3. Regular images (imageUrl, image_urls, images)
    // 4. Video thumbnails (only for YouTube with auto-generation)
    // 5. null (will show nice video placeholder)
    
    // Featured image - highest priority
    if (insight.featuredImage) return insight.featuredImage;
    
    // Explicit thumbnail
    if (insight.thumbnailUrl) return insight.thumbnailUrl;
    
    // Regular images
    if (insight.imageUrl) return insight.imageUrl;
    if (insight.image_urls && insight.image_urls.length > 0)
      return insight.image_urls[0];
    if (insight.images && insight.images.length > 0 && insight.images[0].url)
      return insight.images[0].url;
    
    // Try video thumbnails (only for YouTube or explicit thumbnails)
    if (insight.videos && insight.videos.length > 0) {
      const firstVideo = insight.videos[0];
      // If video has explicit thumbnail, use it
      if (firstVideo.thumbnail) return firstVideo.thumbnail;
      // Only generate thumbnail for YouTube videos
      if (firstVideo.type === "youtube") {
        const videoId = firstVideo.url.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
        )?.[1];
        return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
      }
    }
    if (insight.videoUrl) {
      // Legacy video URL - check if it's YouTube
      const videoId = insight.videoUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
      )?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }
    
    // No thumbnail available - will show nice video placeholder
    return null;
  };

  const hasVideoContent = () => {
    return (
      insight.videoUrl ||
      (insight.video_urls && insight.video_urls.length > 0) ||
      (insight.videos && insight.videos.length > 0)
    );
  };

  const { imageCount, videoCount } = getMediaCount();

  return (
    <div className="insight-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="insight-card-header flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className="insight-card-title font-semibold text-gray-900 text-base leading-tight cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onView(insight)}
          >
            {insight.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {insight.description}
          </p>
        </div>
        {(getFirstMediaUrl() || hasVideoContent()) && (
          <div className="ml-3 flex-shrink-0 relative">
            {getFirstMediaUrl() ? (
              <img
                src={getFirstMediaUrl()}
                alt=""
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : hasVideoContent() ? (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
                  }}></div>
                </div>
                {/* Play icon */}
                <svg className="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {/* Video badge */}
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-[8px] px-1 py-0.5 rounded">
                  VIDEO
                </div>
              </div>
            ) : null}
            {hasVideoContent() && getFirstMediaUrl() && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="insight-card-meta flex flex-wrap gap-2 mb-3">
        {/* Status */}
        <div className="flex items-center gap-1">
          {getStatusIcon(insight.status)}
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${insight.getStatusBadgeColor()}`}
          >
            {insight.status}
          </span>
        </div>

        {/* Category */}
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800 capitalize">
          {insight.category}
        </span>

        {/* Featured */}
        {insight.isFeatured && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-800">
            ⭐ Featured
          </span>
        )}

        {/* Media Count */}
        {(imageCount > 0 || videoCount > 0) && (
          <div className="flex gap-1">
            {imageCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                📷 {imageCount}
              </span>
            )}
            {videoCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-800">
                🎥 {videoCount}
              </span>
            )}
          </div>
        )}

        {/* Deleted */}
        {insight.isDeleted && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">
            🗑️ Deleted
          </span>
        )}
      </div>

      {/* Stats and Author */}
      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-4">
          <span>👁 {insight.viewCount}</span>
          <span>❤️ {insight.likeCount}</span>
          <span>{insight.getReadTimeText()}</span>
        </div>
        <div className="text-right">
          <div className="font-medium text-gray-700">{insight.author}</div>
          <div className="text-xs">
            {insight.updatedAt
              ? insight.updatedAt.toLocaleDateString()
              : "Never"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="insight-card-actions flex flex-wrap gap-2">
        <button
          onClick={() => onView(insight)}
          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
        >
          👁️ View
        </button>

        {!insight.isDeleted && (
          <Link
            to={`/skincare-insights/${insight.id}/edit`}
            className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-center"
            onClick={(e) => e.stopPropagation()}
          >
            ✏️ Edit
          </Link>
        )}

        {insight.isDeleted ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore(insight);
            }}
            className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
          >
            ↩️ Restore
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(insight);
            }}
            className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileInsightCard;
