import React, { useState } from "react";

const InsightModal = ({ insight, isOpen, onClose }) => {
  if (!isOpen || !insight) return null;

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const formatDate = (date) => {
    if (!date) return "Not set";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to strip HTML tags and convert to plain text
  const stripHtml = (html) => {
    if (!html) return "";

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Get text content and clean up extra whitespace
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const formatContent = (content) => {
    if (!content) return "";

    // Strip any HTML tags and convert to plain text
    const plainText = stripHtml(content);

    // Convert line breaks to paragraphs for plain text
    return plainText.split("\n").map(
      (paragraph, index) =>
        paragraph.trim() && (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {paragraph.trim()}
          </p>
        )
    );
  };

  // Get all media items (using new model structure)
  const allMedia = insight.media || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${insight.getStatusBadgeColor()}`}
            >
              {insight.status}
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {insight.category}
            </span>
            {insight.isFeatured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Featured
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Insight Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {insight.title}
              </h1>

              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>By {insight.author}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{insight.getReadTimeText()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Published {formatDate(insight.publishDate)}</span>
                </div>
              </div>

              {insight.description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {insight.description}
                </p>
              )}
            </div>

            {/* Featured Media */}
            {insight.featuredImage && (
              <div className="mb-6">
                <img
                  src={insight.featuredImage}
                  alt={insight.title}
                  className="w-full h-64 object-cover rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Media Carousel */}
            {allMedia.length > 0 && (
              <div className="mb-6">
                {allMedia.length === 1 ? (
                  // Single media item
                  <div>
                    {allMedia[0].type === "image" ? (
                      <img
                        src={allMedia[0].url}
                        alt={allMedia[0].alt || insight.title}
                        className="w-full h-64 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div
                        className="rounded-lg overflow-hidden shadow-sm"
                        style={{ height: "300px" }}
                      >
                        <video
                          controls
                          className="w-full h-full object-cover"
                          poster={allMedia[0].thumbnail}
                        >
                          <source src={allMedia[0].url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {allMedia[0].caption && (
                      <p className="text-sm text-gray-600 mt-2 text-center italic">
                        {allMedia[0].caption}
                      </p>
                    )}
                  </div>
                ) : (
                  // Multiple media items - carousel
                  <div className="relative">
                    {allMedia[currentMediaIndex].type === "image" ? (
                      <img
                        src={allMedia[currentMediaIndex].url}
                        alt={allMedia[currentMediaIndex].alt || insight.title}
                        className="w-full h-64 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div
                        className="rounded-lg overflow-hidden shadow-sm"
                        style={{ height: "300px" }}
                      >
                        <video
                          controls
                          className="w-full h-full object-cover"
                          poster={allMedia[currentMediaIndex].thumbnail}
                        >
                          <source
                            src={allMedia[currentMediaIndex].url}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {/* Caption */}
                    {allMedia[currentMediaIndex].caption && (
                      <p className="text-sm text-gray-600 mt-2 text-center italic">
                        {allMedia[currentMediaIndex].caption}
                      </p>
                    )}

                    {/* Previous Button */}
                    <button
                      onClick={() =>
                        setCurrentMediaIndex(
                          currentMediaIndex === 0
                            ? allMedia.length - 1
                            : currentMediaIndex - 1
                        )
                      }
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={() =>
                        setCurrentMediaIndex(
                          currentMediaIndex === allMedia.length - 1
                            ? 0
                            : currentMediaIndex + 1
                        )
                      }
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {/* Dots Indicator with Media Type Icons */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {allMedia.map((media, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMediaIndex(index)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            index === currentMediaIndex
                              ? "bg-white text-black"
                              : "bg-black bg-opacity-50 text-white"
                          }`}
                          title={media.type === "image" ? "Image" : "Video"}
                        >
                          {media.type === "image" ? (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Media Counter with Type */}
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {currentMediaIndex + 1} / {allMedia.length}
                      <span className="ml-1 text-xs opacity-75">
                        ({allMedia[currentMediaIndex].type})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insight Content */}
            <div className="text-gray-900 leading-relaxed">
              {formatContent(insight.content)}
            </div>

            {/* Tags */}
            {insight.tags && insight.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {insight.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Types & Concerns */}
            {(insight.skinTypes?.length > 0 || insight.skinConcerns?.length > 0) && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {insight.skinTypes?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Skin Types
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {insight.skinTypes.map((type, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {insight.skinConcerns?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Skin Concerns
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {insight.skinConcerns.map((concern, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Author Bio */}
            {insight.authorBio && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-4">
                  {insight.authorImage ? (
                    <img
                      src={insight.authorImage}
                      alt={insight.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {insight.author}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.authorBio}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {insight.viewCount}
                  </div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {insight.likeCount}
                  </div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {insight.saveCount || 0}
                  </div>
                  <div className="text-sm text-gray-500">Saves</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 capitalize">
                    {insight.difficulty}
                  </div>
                  <div className="text-sm text-gray-500">Difficulty</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;

