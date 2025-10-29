import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import MediaManager from "../components/MediaManager";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  SkincareInsight,
  CATEGORIES,
  SKIN_TYPES,
  SKIN_CONCERNS,
} from "../models/SkincareInsight";

const EnhancedSkincareInsightForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  // Helper function to strip HTML tags and convert to plain text
  const stripHtml = (html) => {
    if (!html) return "";

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Get text content and clean up extra whitespace
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const [insight, setInsight] = useState(new SkincareInsight());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeTab, setActiveTab] = useState("basic");
  const [autoSaveStatus, setAutoSaveStatus] = useState(""); // "saving", "saved", ""

  // Auto-save key for localStorage
  const autoSaveKey = `insight-draft-${id || "new"}`;

  // Check user role for debugging
  const checkUserRole = async () => {
    if (!user?.uid) {
      console.log("No user found");
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User role data:", userData);
        return userData.role;
      } else {
        console.log("User document does not exist");
        return null;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  // Simple upload function
  const uploadFileToStorage = async (file, type) => {
    const timestamp = Date.now();

    // Use insights path - now allows any authenticated user
    const filename = `insights/${type}s/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);

    try {
      // Check user role before upload
      const userRole = await checkUserRole();

      console.log("Attempting upload:", {
        filename,
        user: user?.uid,
        userEmail: user?.email,
        userRole: userRole,
        fileSize: file.size,
        fileType: file.type,
      });

      // Authenticated user can upload to insights folder
      console.log(
        `User authenticated: ${!!user?.uid}, proceeding with upload to insights folder...`
      );

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Upload error:", error);
      console.error("User info:", {
        uid: user?.uid,
        email: user?.email,
        claims: user?.customClaims,
      });
      throw error;
    }
  };

  // Upload all files and get URLs
  const uploadAllFiles = async (images = [], videos = []) => {
    console.log("Starting upload process for:", { images, videos });

    const imageUrls = [];
    const videoUrls = [];

    // Upload images
    for (const image of images) {
      if (image.isFile && image.file) {
        try {
          const url = await uploadFileToStorage(image.file, "image");
          imageUrls.push(url);
          console.log("Uploaded image:", url);
        } catch (error) {
          console.error("Failed to upload image:", image.filename, error);
          throw new Error(`Failed to upload image: ${image.filename}`);
        }
      } else if (image.url && !image.isFile) {
        // URL-based image
        imageUrls.push(image.url);
      }
    }

    // Upload videos and their thumbnails
    for (const video of videos) {
      if (video.isFile && video.file) {
        try {
          // Upload the video file
          const videoUrl = await uploadFileToStorage(video.file, "video");

          // Upload the thumbnail if it exists
          let thumbnailUrl = null;
          if (video.thumbnail && video.thumbnail.startsWith("blob:")) {
            try {
              // Convert blob URL to blob
              const response = await fetch(video.thumbnail);
              const thumbnailBlob = await response.blob();

              // Create a file-like object for the thumbnail
              const thumbnailFile = new File(
                [thumbnailBlob],
                `${video.filename}_thumbnail.jpg`,
                {
                  type: "image/jpeg",
                }
              );

              // Upload thumbnail to Firebase Storage
              thumbnailUrl = await uploadFileToStorage(thumbnailFile, "image");
              console.log("Uploaded video thumbnail:", thumbnailUrl);
            } catch (thumbnailError) {
              console.warn("Failed to upload video thumbnail:", thumbnailError);
              // Continue without thumbnail - not critical
            }
          }

          // Store video URL with thumbnail reference
          videoUrls.push({
            url: videoUrl,
            thumbnail: thumbnailUrl,
            type: video.type || "upload",
            filename: video.filename,
          });

          console.log(
            "Uploaded video:",
            videoUrl,
            "with thumbnail:",
            thumbnailUrl
          );
        } catch (error) {
          console.error("Failed to upload video:", video.filename, error);
          throw new Error(`Failed to upload video: ${video.filename}`);
        }
      } else if (video.url && !video.isFile) {
        // URL-based video (YouTube, etc.)
        videoUrls.push({
          url: video.url,
          thumbnail: video.thumbnail,
          type: video.type || "direct",
          filename: video.filename || "External Video",
        });
      }
    }

    return { imageUrls, videoUrls };
  };

  useEffect(() => {
    if (isEditing) {
      loadInsight();
    } else {
      // Load auto-saved draft for new insights
      loadAutoSavedDraft();
    }
  }, [id]);

  // Auto-save effect
  useEffect(() => {
    if (insight.title || insight.content || insight.description) {
      setAutoSaveStatus("saving");
      const timeoutId = setTimeout(() => {
        saveToLocalStorage();
        setAutoSaveStatus("saved");
        // Clear the "saved" status after 2 seconds
        setTimeout(() => setAutoSaveStatus(""), 2000);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [insight]);

  const loadAutoSavedDraft = () => {
    try {
      const savedDraft = localStorage.getItem(autoSaveKey);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        // Convert date strings back to Date objects
        if (parsedDraft.publishDate) {
          parsedDraft.publishDate = new Date(parsedDraft.publishDate);
        }
        if (parsedDraft.scheduledPublishDate) {
          parsedDraft.scheduledPublishDate = new Date(
            parsedDraft.scheduledPublishDate
          );
        }
        setInsight(new SkincareInsight(parsedDraft));
      }
    } catch (error) {
      console.error("Error loading auto-saved draft:", error);
    }
  };

  const saveToLocalStorage = () => {
    try {
      // Only save if there's meaningful content
      if (insight.title || insight.content || insight.description) {
        // Create a clean version without File objects for localStorage
        const cleanInsight = {
          ...insight,
          images:
            insight.images?.map((img) => {
              const { file, ...cleanImg } = img;
              return cleanImg;
            }) || [],
          videos:
            insight.videos?.map((vid) => {
              const { file, ...cleanVid } = vid;
              return cleanVid;
            }) || [],
        };
        localStorage.setItem(autoSaveKey, JSON.stringify(cleanInsight));
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const clearAutoSavedDraft = () => {
    try {
      localStorage.removeItem(autoSaveKey);
    } catch (error) {
      console.error("Error clearing auto-saved draft:", error);
    }
  };

  const loadInsight = async () => {
    try {
      setLoading(true);
      const insightData = await SkincareInsight.getById(id);

      // Convert URL arrays back to image/video objects for editing
      if (
        insightData.image_urls &&
        insightData.image_urls.length > 0 &&
        (!insightData.images || insightData.images.length === 0)
      ) {
        insightData.images = insightData.image_urls.map((url, index) => ({
          id: `url-${index}`,
          url: url,
          caption: "",
          alt: `Image ${index + 1}`,
          filename: "external",
          isFile: false,
        }));
      }

      if (
        insightData.video_urls &&
        insightData.video_urls.length > 0 &&
        (!insightData.videos || insightData.videos.length === 0)
      ) {
        insightData.videos = insightData.video_urls.map((url, index) => ({
          id: `url-${index}`,
          url: url,
          caption: "",
          thumbnail: "", // Will be populated from videos array if available
          type: "direct",
          filename: "external",
          isFile: false,
        }));
      }

      // If we have videos with thumbnails, merge the thumbnail data
      if (insightData.videos && insightData.videos.length > 0) {
        insightData.videos = insightData.videos.map((video, index) => ({
          ...video,
          // Ensure we have the thumbnail from the video object
          thumbnail: video.thumbnail || "",
          isFile: false,
        }));
      }

      // Strip HTML from content if it exists
      if (insightData.content) {
        insightData.content = stripHtml(insightData.content);
      }

      setInsight(insightData);
    } catch (err) {
      console.error("Error loading insight:", err);
      setErrors(["Failed to load insight. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setInsight((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }

    // Clear field-specific errors
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setInsight((prev) => {
      const currentArray = prev[field] || [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value],
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter((item) => item !== value),
        };
      }
    });

    // Clear field-specific errors for array fields
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (isPublishing = false) => {
    const newFieldErrors = {};
    const newErrors = [];

    // Required fields validation
    if (!insight.title || insight.title.trim().length < 5) {
      newFieldErrors.title = "Title must be at least 5 characters long";
      newErrors.push(
        "Title is required and must be at least 5 characters long"
      );
    }

    if (!insight.content || insight.content.trim().length < 50) {
      newFieldErrors.content = "Content must be at least 50 characters long";
      newErrors.push(
        "Content is required and must be at least 50 characters long"
      );
    }

    if (!insight.description || insight.description.trim().length < 20) {
      newFieldErrors.description =
        "Description must be at least 20 characters long";
      newErrors.push(
        "Description is required and must be at least 20 characters long"
      );
    }

    if (!insight.author || insight.author.trim().length < 2) {
      newFieldErrors.author = "Author name is required";
      newErrors.push("Author name is required");
    }

    if (!insight.category || insight.category.trim().length === 0) {
      newFieldErrors.category = "Category is required";
      newErrors.push("Category is required");
    }

    if (
      !insight.readTimeMinutes ||
      insight.readTimeMinutes < 1 ||
      insight.readTimeMinutes > 60
    ) {
      newFieldErrors.readTimeMinutes =
        "Read time must be between 1 and 60 minutes";
      newErrors.push("Read time must be between 1 and 60 minutes");
    }

    if (!insight.tags || insight.tags.length === 0) {
      newFieldErrors.tags = "At least one tag is required";
      newErrors.push("At least one tag is required");
    }

    if (!insight.skinTypes || insight.skinTypes.length === 0) {
      newFieldErrors.skinTypes = "At least one skin type must be selected";
      newErrors.push("At least one skin type must be selected");
    }

    // Media validation
    if (insight.images && insight.images.length > 5) {
      newFieldErrors.images = "Maximum 5 images allowed";
      newErrors.push("Maximum 5 images allowed per insight");
    }

    if (insight.videos && insight.videos.length > 3) {
      newFieldErrors.videos = "Maximum 3 videos allowed";
      newErrors.push("Maximum 3 videos allowed per insight");
    }

    setFieldErrors(newFieldErrors);
    setErrors(newErrors);

    return Object.keys(newFieldErrors).length === 0;
  };

  const getFieldClassName = (
    fieldName,
    baseClassName = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
  ) => {
    const hasError = fieldErrors[fieldName];
    if (hasError) {
      return `${baseClassName} border-red-500 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500`;
    }
    return `${baseClassName} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErrors([]);

      // Upload files and get URLs
      let finalInsight = { ...insight };
      try {
        console.log("About to upload files:", {
          images: insight.images,
          videos: insight.videos,
        });

        const { imageUrls, videoUrls } = await uploadAllFiles(
          insight.images || [],
          insight.videos || []
        );

        console.log("Upload completed:", { imageUrls, videoUrls });

        finalInsight = {
          ...finalInsight,
          image_urls: imageUrls,
          video_urls: videoUrls.map((v) => (typeof v === "string" ? v : v.url)), // Extract URLs for simple storage
          videos: videoUrls
            .filter((v) => typeof v === "object")
            .map((v) => ({
              url: v.url,
              thumbnail: v.thumbnail,
              type: v.type,
              filename: v.filename,
              caption: "",
              id: Math.random().toString(36).substr(2, 9),
            })), // Store video objects with thumbnails
          // Remove the original images array to avoid storing File objects
          images: undefined,
        };
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        setErrors([uploadError.message]);
        return;
      }

      // Create a proper SkincareInsight instance (save as draft)
      const insightToSave = new SkincareInsight({
        ...finalInsight,
        status: "draft",
        createdBy: finalInsight.createdBy || user?.uid || "unknown",
        updatedBy: user?.uid || "unknown",
        metaTitle: finalInsight.metaTitle || finalInsight.title,
        metaDescription:
          finalInsight.metaDescription || finalInsight.description,
      });

      await insightToSave.save();
      clearAutoSavedDraft(); // Clear auto-saved draft on successful save
      navigate("/skincare-insights");
    } catch (err) {
      console.error("Error saving insight:", err);
      if (err.message.includes("Validation failed:")) {
        setErrors([err.message.replace("Validation failed: ", "")]);
      } else {
        setErrors(["Failed to save insight. Please try again."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm(true)) {
      return;
    }

    try {
      setSaving(true);
      setErrors([]);
      setFieldErrors({});

      const publishDate = new Date();

      // Upload files and get URLs
      let finalInsight = { ...insight };
      try {
        console.log("About to upload files for publishing:", {
          images: insight.images,
          videos: insight.videos,
        });

        const { imageUrls, videoUrls } = await uploadAllFiles(
          insight.images || [],
          insight.videos || []
        );

        console.log("Upload completed for publishing:", {
          imageUrls,
          videoUrls,
        });

        finalInsight = {
          ...finalInsight,
          image_urls: imageUrls,
          video_urls: videoUrls.map((v) => (typeof v === "string" ? v : v.url)), // Extract URLs for simple storage
          videos: videoUrls
            .filter((v) => typeof v === "object")
            .map((v) => ({
              url: v.url,
              thumbnail: v.thumbnail,
              type: v.type,
              filename: v.filename,
              caption: "",
              id: Math.random().toString(36).substr(2, 9),
            })), // Store video objects with thumbnails
          // Remove the original images array to avoid storing File objects
          images: undefined,
        };
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        setErrors([uploadError.message]);
        return;
      }

      const insightToSave = new SkincareInsight({
        ...finalInsight,
        status: "published",
        publishDate: publishDate,
        createdBy: finalInsight.createdBy || user?.uid || "unknown",
        updatedBy: user?.uid || "unknown",
        metaTitle: finalInsight.metaTitle || finalInsight.title,
        metaDescription:
          finalInsight.metaDescription || finalInsight.description,
      });

      await insightToSave.save();
      clearAutoSavedDraft(); // Clear auto-saved draft on successful save
      navigate("/skincare-insights");
    } catch (err) {
      console.error("Error publishing insight:", err);
      if (err.message.includes("Validation failed:")) {
        setErrors([err.message.replace("Validation failed: ", "")]);
      } else {
        setErrors(["Failed to publish insight. Please try again."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: "basic",
      name: "Basic Info",
      icon: "📝",
      description: "Title, description, and basic settings",
    },
    {
      id: "content",
      name: "Content",
      icon: "📄",
      description: "Plain text editor for article content",
    },
    {
      id: "media",
      name: "Media",
      icon: "🖼️",
      description: "Images and videos (5 images, 3 videos max)",
    },
    {
      id: "targeting",
      name: "Targeting",
      icon: "🎯",
      description: "Skin types and concerns",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading insight...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {isEditing ? "Edit Insight" : "Create New Insight"}
                </h1>
                {/* Auto-save indicator */}
                {autoSaveStatus && (
                  <div className="flex items-center gap-1 text-sm">
                    {autoSaveStatus === "saving" && (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                        <span className="text-blue-600">Saving...</span>
                      </>
                    )}
                    {autoSaveStatus === "saved" && (
                      <>
                        <svg
                          className="w-3 h-3 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-600">Auto-saved</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {isEditing
                  ? "Update your skincare insight with rich content and media"
                  : "Create engaging insights with text, images, and videos"}
              </p>
            </div>
            <button
              onClick={() => navigate("/skincare-insights")}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              ← Back to Insights
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
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
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <div className="text-left">
                        <div>{tab.name}</div>
                        <div className="text-xs text-gray-400 hidden md:block">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Article Title *
                      </label>
                      <input
                        type="text"
                        value={insight.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        className={getFieldClassName("title")}
                        placeholder="Enter a compelling title that attracts readers..."
                        required
                      />
                      {fieldErrors.title && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.title}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        This will be the main headline visible to users
                      </p>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={insight.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        rows={3}
                        className={getFieldClassName("description")}
                        placeholder="Brief description that will appear in article previews and search results..."
                        required
                      />
                      {fieldErrors.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.description}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Keep it concise but informative (20+ characters)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={insight.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        className={getFieldClassName("category")}
                        required
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.category && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author Name *
                      </label>
                      <input
                        type="text"
                        value={insight.author}
                        onChange={(e) =>
                          handleInputChange("author", e.target.value)
                        }
                        className={getFieldClassName("author")}
                        placeholder="Author name"
                        required
                      />
                      {fieldErrors.author && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.author}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Read Time (minutes) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={insight.readTimeMinutes}
                        onChange={(e) =>
                          handleInputChange(
                            "readTimeMinutes",
                            parseInt(e.target.value)
                          )
                        }
                        className={getFieldClassName("readTimeMinutes")}
                        required
                      />
                      {fieldErrors.readTimeMinutes && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.readTimeMinutes}
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags *
                      </label>
                      <div
                        className={`border rounded-md p-3 ${
                          fieldErrors.tags
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        {/* Existing Tags */}
                        {insight.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {insight.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTags = insight.tags.filter(
                                      (_, i) => i !== index
                                    );
                                    handleInputChange("tags", newTags);
                                  }}
                                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Add New Tag Input */}
                        <input
                          type="text"
                          placeholder="Type a tag and press Enter..."
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-0 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const newTag = e.target.value.trim();
                              if (newTag && !insight.tags.includes(newTag)) {
                                handleInputChange("tags", [
                                  ...insight.tags,
                                  newTag,
                                ]);
                                e.target.value = "";
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const newTag = e.target.value.trim();
                            if (newTag && !insight.tags.includes(newTag)) {
                              handleInputChange("tags", [
                                ...insight.tags,
                                newTag,
                              ]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                      {fieldErrors.tags && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.tags}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Type tags and press Enter or comma to add them. At least
                        one tag is required.
                      </p>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Keywords
                      </label>
                      <div className="border border-gray-300 rounded-md p-3">
                        {/* Existing Keywords */}
                        {insight.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {insight.keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newKeywords = insight.keywords.filter(
                                      (_, i) => i !== index
                                    );
                                    handleInputChange("keywords", newKeywords);
                                  }}
                                  className="ml-2 text-purple-600 hover:text-purple-800 focus:outline-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Add New Keyword Input */}
                        <input
                          type="text"
                          placeholder="Type a keyword and press Enter..."
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-0 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const newKeyword = e.target.value.trim();
                              if (
                                newKeyword &&
                                !insight.keywords.includes(newKeyword)
                              ) {
                                handleInputChange("keywords", [
                                  ...insight.keywords,
                                  newKeyword,
                                ]);
                                e.target.value = "";
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const newKeyword = e.target.value.trim();
                            if (
                              newKeyword &&
                              !insight.keywords.includes(newKeyword)
                            ) {
                              handleInputChange("keywords", [
                                ...insight.keywords,
                                newKeyword,
                              ]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Keywords help users find your content through search
                      </p>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={insight.isFeatured}
                          onChange={(e) =>
                            handleInputChange("isFeatured", e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Featured Article
                        </span>
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Featured articles appear prominently on the homepage
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Article Content *
                    </label>
                    <RichTextEditor
                      value={insight.content}
                      onChange={(value) => handleInputChange("content", value)}
                      placeholder="Start writing your article content here. Use the toolbar to format text, add headings, lists, and more..."
                      className={fieldErrors.content ? "border-red-500" : ""}
                      minHeight="500px"
                    />
                    {fieldErrors.content && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.content}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Write your article content in plain text. Minimum 50
                      characters required.
                    </p>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 text-xl">💡</div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          Media Guidelines
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Maximum 5 images per insight</li>
                          <li>• Maximum 3 videos per insight</li>
                          <li>
                            • Supported formats: JPG, PNG, GIF for images | MP4,
                            WebM for videos
                          </li>
                          <li>• YouTube and Vimeo links are also supported</li>
                          <li>
                            • Add captions to make content more accessible
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <MediaManager
                    images={insight.images || []}
                    videos={insight.videos || []}
                    onImagesChange={(images) =>
                      handleInputChange("images", images)
                    }
                    onVideosChange={(videos) =>
                      handleInputChange("videos", videos)
                    }
                    maxImages={5}
                    maxVideos={3}
                  />

                  {(fieldErrors.images || fieldErrors.videos) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      {fieldErrors.images && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.images}
                        </p>
                      )}
                      {fieldErrors.videos && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.videos}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Targeting Tab */}
              {activeTab === "targeting" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Skin Types * (Select all that apply)
                    </label>
                    <div
                      className={`grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg border ${
                        fieldErrors.skinTypes
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {SKIN_TYPES.map((type) => (
                        <label
                          key={type.value}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={insight.skinTypes.includes(type.value)}
                            onChange={(e) =>
                              handleArrayChange(
                                "skinTypes",
                                type.value,
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.skinTypes && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.skinTypes}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Skin Concerns (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      {SKIN_CONCERNS.map((concern) => (
                        <label
                          key={concern.value}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={insight.skinConcerns.includes(
                              concern.value
                            )}
                            onChange={(e) =>
                              handleArrayChange(
                                "skinConcerns",
                                concern.value,
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {concern.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left side - Cancel or Previous */}
              {activeTab === tabs[0].id ? (
                <button
                  type="button"
                  onClick={() => navigate("/skincare-insights")}
                  className="w-full md:w-auto px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(
                      (tab) => tab.id === activeTab
                    );
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1].id);
                    }
                  }}
                  className="w-full md:w-auto px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  ← Previous
                </button>
              )}

              {/* Right side - Next or Publish */}
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                {activeTab === tabs[tabs.length - 1].id ? (
                  // Last tab - show Publish button
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving}
                    className="w-full md:w-auto px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Publishing..." : "Publish Article"}
                  </button>
                ) : (
                  // Not last tab - show Next button
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(
                        (tab) => tab.id === activeTab
                      );
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1].id);
                      }
                    }}
                    className="w-full md:w-auto px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className={`h-2 rounded-full transition-all ${
                    tab.id === activeTab
                      ? "w-8 bg-blue-600"
                      : tabs.findIndex((t) => t.id === activeTab) > index
                      ? "w-2 bg-green-500"
                      : "w-2 bg-gray-300"
                  }`}
                  title={tab.name}
                />
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedSkincareInsightForm;
