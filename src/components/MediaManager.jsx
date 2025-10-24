import React, { useState } from "react";

const MediaManager = ({
  images = [],
  videos = [],
  onImagesChange,
  onVideosChange,
  maxImages = 5,
  maxVideos = 3,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [showVideoUrlModal, setShowVideoUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Generate thumbnail from video file
  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve) => {
      console.log("Generating thumbnail for video:", videoFile.name);

      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set video properties for better compatibility
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      let hasResolved = false;

      const cleanup = () => {
        if (video.src) {
          URL.revokeObjectURL(video.src);
        }
        video.removeAttribute("src");
        video.load();
      };

      const resolveOnce = (result) => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          console.log(
            "Thumbnail generation result:",
            result ? "Success" : "Failed"
          );
          resolve(result);
        }
      };

      video.addEventListener("loadedmetadata", () => {
        console.log("Video metadata loaded:", {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });

        // Set canvas dimensions to match video (with reasonable limits)
        const maxSize = 800;
        let { videoWidth, videoHeight } = video;

        if (videoWidth > maxSize || videoHeight > maxSize) {
          const ratio = Math.min(maxSize / videoWidth, maxSize / videoHeight);
          videoWidth *= ratio;
          videoHeight *= ratio;
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // Seek to 1 second or 10% of video duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        console.log("Seeking to time:", seekTime);
        video.currentTime = seekTime;
      });

      video.addEventListener("seeked", () => {
        console.log("Video seeked, drawing to canvas");
        try {
          // Draw the current frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob and create URL
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbnailUrl = URL.createObjectURL(blob);
                console.log("Thumbnail blob created:", thumbnailUrl);
                resolveOnce(thumbnailUrl);
              } else {
                console.error("Failed to create blob from canvas");
                resolveOnce(null);
              }
            },
            "image/jpeg",
            0.8
          );
        } catch (error) {
          console.error("Error drawing video to canvas:", error);
          resolveOnce(null);
        }
      });

      video.addEventListener("error", (e) => {
        console.error("Video loading error:", e);
        resolveOnce(null);
      });

      video.addEventListener("loadeddata", () => {
        console.log("Video data loaded");
      });

      // Timeout fallback
      setTimeout(() => {
        if (!hasResolved) {
          console.warn("Video thumbnail generation timeout");
          resolveOnce(null);
        }
      }, 10000); // 10 second timeout

      // Set video source and load
      try {
        video.src = URL.createObjectURL(videoFile);
        video.load();
      } catch (error) {
        console.error("Error setting video source:", error);
        resolveOnce(null);
      }
    });
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (images.length + files.length > maxImages) {
      alert(
        `Maximum ${maxImages} images allowed. You can add ${
          maxImages - images.length
        } more.`
      );
      // Reset the file input
      event.target.value = "";
      return;
    }

    const newImages = [];
    for (const file of files) {
      // Create object URL for preview, store file for later upload
      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        id: generateId(),
        url: previewUrl,
        caption: "",
        alt: file.name.split(".")[0],
        filename: file.name,
        file: file, // Store the actual file for later upload
        isFile: true, // Flag to identify file vs URL
      });
    }
    onImagesChange([...images, ...newImages]);
    // Reset the file input to allow selecting the same file again
    event.target.value = "";
  };

  const handleVideoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (videos.length + files.length > maxVideos) {
      alert(
        `Maximum ${maxVideos} videos allowed. You can add ${
          maxVideos - videos.length
        } more.`
      );
      // Reset the file input
      event.target.value = "";
      return;
    }

    setUploading(true);
    const newVideos = [];

    // First, add videos without thumbnails (for immediate UI feedback)
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);

      newVideos.push({
        id: generateId(),
        url: previewUrl,
        caption: "",
        thumbnail: null, // Will be set later
        type: "upload",
        filename: file.name,
        file: file,
        isFile: true,
        thumbnailGenerating: true, // Flag to show loading state
      });
    }

    // Add videos to state immediately
    const currentVideos = [...videos, ...newVideos];
    onVideosChange(currentVideos);

    // Generate thumbnails asynchronously
    for (let i = 0; i < newVideos.length; i++) {
      const video = newVideos[i];
      const file = files[i];

      try {
        console.log(`Generating thumbnail for ${file.name}...`);
        const thumbnailUrl = await generateVideoThumbnail(file);

        // Update the specific video with the generated thumbnail
        const updatedVideos = currentVideos.map((v) =>
          v.id === video.id
            ? { ...v, thumbnail: thumbnailUrl, thumbnailGenerating: false }
            : v
        );

        onVideosChange(updatedVideos);
        console.log(
          `Thumbnail generated for ${file.name}:`,
          thumbnailUrl ? "Success" : "Failed"
        );
      } catch (error) {
        console.error(`Error generating thumbnail for ${file.name}:`, error);

        // Update video to remove loading state
        const updatedVideos = currentVideos.map((v) =>
          v.id === video.id ? { ...v, thumbnailGenerating: false } : v
        );

        onVideosChange(updatedVideos);
      }
    }

    setUploading(false);

    // Reset the file input
    event.target.value = "";
  };

  const addImageByUrl = () => {
    setShowImageUrlModal(true);
    setUrlInput("");
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;

    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const newImage = {
      id: generateId(),
      url: urlInput.trim(),
      caption: "",
      alt: "External image",
      filename: "external",
    };
    onImagesChange([...images, newImage]);
    setShowImageUrlModal(false);
    setUrlInput("");
  };

  const addVideoByUrl = () => {
    setShowVideoUrlModal(true);
    setUrlInput("");
  };

  const handleAddVideoUrl = () => {
    if (!urlInput.trim()) return;

    if (videos.length >= maxVideos) {
      alert(`Maximum ${maxVideos} videos allowed.`);
      return;
    }

    let type = "direct";
    let thumbnail = "";
    const url = urlInput.trim();

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      type = "youtube";
      // Extract YouTube video ID and generate thumbnail
      const videoId = extractYouTubeId(url);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } else if (url.includes("vimeo.com")) {
      type = "vimeo";
    }

    const newVideo = {
      id: generateId(),
      url,
      caption: "",
      thumbnail,
      type,
      filename: "external",
    };
    onVideosChange([...videos, newVideo]);
    setShowVideoUrlModal(false);
    setUrlInput("");
  };

  const extractYouTubeId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const updateImageCaption = (id, caption) => {
    const updatedImages = images.map((img) =>
      img.id === id ? { ...img, caption } : img
    );
    onImagesChange(updatedImages);
  };

  const updateVideoCaption = (id, caption) => {
    const updatedVideos = videos.map((video) =>
      video.id === id ? { ...video, caption } : video
    );
    onVideosChange(updatedVideos);
  };

  const removeImage = (id) => {
    const updatedImages = images.filter((img) => img.id !== id);
    onImagesChange(updatedImages);
  };

  const removeVideo = (id) => {
    const updatedVideos = videos.filter((video) => video.id !== id);
    onVideosChange(updatedVideos);
  };

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  const moveVideo = (fromIndex, toIndex) => {
    const newVideos = [...videos];
    const [movedVideo] = newVideos.splice(fromIndex, 1);
    newVideos.splice(toIndex, 0, movedVideo);
    onVideosChange(newVideos);
  };

  const getVideoThumbnail = (video) => {
    // If we have a generated thumbnail, use it
    if (video.thumbnail) return video.thumbnail;

    if (video.type === "youtube") {
      const videoId = video.url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
      )?.[1];
      return videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : null;
    }

    // For uploaded video files without thumbnail, return null to show placeholder
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Images Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Images ({images.length}/{maxImages})
          </h3>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || images.length >= maxImages}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors ${
                uploading || images.length >= maxImages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Select Images
            </label>
            <button
              type="button"
              onClick={addImageByUrl}
              disabled={images.length >= maxImages}
              className={`px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors ${
                images.length >= maxImages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Add by URL
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index - 1)}
                        className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="p-1 bg-red-600 bg-opacity-80 text-white rounded hover:bg-opacity-100"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={image.caption}
                    onChange={(e) =>
                      updateImageCaption(image.id, e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">🖼️</div>
            <p className="text-gray-500">No images added yet</p>
            <p className="text-sm text-gray-400">
              Select images or add by URL for your insight
            </p>
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Videos ({videos.length}/{maxVideos})
          </h3>
          <div className="flex gap-2">
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              disabled={uploading || videos.length >= maxVideos}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className={`px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer transition-colors ${
                uploading || videos.length >= maxVideos
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Select Videos
            </label>
            <button
              type="button"
              onClick={addVideoByUrl}
              disabled={videos.length >= maxVideos}
              className={`px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors ${
                videos.length >= maxVideos
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Add by URL
            </button>
          </div>
        </div>

        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="relative">
                  {getVideoThumbnail(video) ? (
                    <div className="relative">
                      <img
                        src={getVideoThumbnail(video)}
                        alt="Video thumbnail"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.error(
                            "Video thumbnail failed to load:",
                            getVideoThumbnail(video)
                          );
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        className="w-full h-48 bg-gray-200 flex items-center justify-center"
                        style={{ display: "none" }}
                      >
                        <div className="text-center">
                          <div className="text-gray-400 text-6xl mb-2">🎬</div>
                          <div className="text-gray-500 text-sm">
                            {video.filename}
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-3">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-2">🎬</div>
                        <div className="text-gray-500 text-sm">
                          {video.filename}
                        </div>
                        {video.thumbnailGenerating ? (
                          <div className="text-blue-500 text-xs mt-1 flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Generating thumbnail...
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs mt-1">
                            No thumbnail available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveVideo(index, index - 1)}
                        className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < videos.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveVideo(index, index + 1)}
                        className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeVideo(video.id)}
                      className="p-1 bg-red-600 bg-opacity-80 text-white rounded hover:bg-opacity-100"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                      {video.type === "youtube"
                        ? "YouTube"
                        : video.type === "vimeo"
                        ? "Vimeo"
                        : video.type === "upload"
                        ? "Uploaded"
                        : "Video"}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={video.caption}
                    onChange={(e) =>
                      updateVideoCaption(video.id, e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    {video.url}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {videos.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">🎥</div>
            <p className="text-gray-500">No videos added yet</p>
            <p className="text-sm text-gray-400">
              Upload videos or add YouTube/Vimeo links to get started
            </p>
          </div>
        )}
      </div>

      {/* Image URL Modal */}
      {showImageUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Image by URL
            </h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddImageUrl}
                disabled={!urlInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Image
              </button>
              <button
                onClick={() => setShowImageUrlModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video URL Modal */}
      {showVideoUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Video by URL
            </h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="YouTube, Vimeo, or direct video URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-2">
              Supported: YouTube, Vimeo, or direct video links (MP4, WebM)
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddVideoUrl}
                disabled={!urlInput.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Video
              </button>
              <button
                onClick={() => setShowVideoUrlModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
