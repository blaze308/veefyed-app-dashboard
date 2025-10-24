import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";
import SchedulingService from "../services/schedulingService";
import {
  SkincareInsight,
  CATEGORIES,
  SKIN_TYPES,
  SKIN_CONCERNS,
  STATUS_OPTIONS,
} from "../models/SkincareInsight";

const SkincareInsightForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [insight, setInsight] = useState(new SkincareInsight());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeTab, setActiveTab] = useState("basic");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadInsight();
    }
  }, [id]);

  const loadInsight = async () => {
    try {
      setLoading(true);
      const insightData = await SkincareInsight.getById(id);
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

    // Publishing-specific validation
    if (isPublishing) {
      if (!insight.publishDate) {
        newFieldErrors.publishDate = "Publish date is required for publishing";
        newErrors.push("Publish date is required for publishing");
      }
    }

    // Scheduled publishing validation
    if (insight.status === "scheduled" && insight.scheduledPublishDate) {
      const validation = SchedulingService.validateScheduleDate(
        insight.scheduledPublishDate
      );
      if (!validation.valid) {
        newFieldErrors.scheduledPublishDate = validation.error;
        newErrors.push(validation.error);
      }
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

      // Validate scheduled publish date if status is scheduled
      if (insight.status === "scheduled" && insight.scheduledPublishDate) {
        const validation = SchedulingService.validateScheduleDate(
          insight.scheduledPublishDate
        );
        if (!validation.valid) {
          setErrors([validation.error]);
          return;
        }
      }

      // Create a proper SkincareInsight instance
      const insightToSave = new SkincareInsight({
        ...insight,
        createdBy: insight.createdBy || user.uid,
        updatedBy: user.uid,
        metaTitle: insight.metaTitle || insight.title,
        metaDescription: insight.metaDescription || insight.description,
      });

      await insightToSave.save();

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

  const handleFileUpload = async (event, fieldType) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `insights/${fieldType}/${timestamp}_${file.name}`;

      // Create a reference to the file location
      const storageRef = ref(storage, filename);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the insight with the new URL
      const urlField =
        fieldType === "image"
          ? "imageUrl"
          : fieldType === "video"
          ? "videoUrl"
          : fieldType === "authorImage"
          ? "authorImage"
          : "";

      if (urlField) {
        handleInputChange(urlField, downloadURL);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrors(["Failed to upload file. Please try again."]);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      setSaving(true);
      setErrors([]);

      // Create a proper SkincareInsight instance with draft status
      const insightToSave = new SkincareInsight({
        ...insight,
        status: "draft",
        createdBy: insight.createdBy || user.uid,
        updatedBy: user.uid,
        metaTitle: insight.metaTitle || insight.title,
        metaDescription: insight.metaDescription || insight.description,
      });

      await insightToSave.save();
      navigate("/skincare-insights");
    } catch (err) {
      console.error("Error saving draft:", err);
      if (err.message.includes("Validation failed:")) {
        setErrors([err.message.replace("Validation failed: ", "")]);
      } else {
        setErrors(["Failed to save draft. Please try again."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    // Validate form with publishing requirements
    if (!validateForm(true)) {
      return;
    }

    try {
      setSaving(true);
      setErrors([]);
      setFieldErrors({});

      // Set publish date if not already set
      const publishDate = insight.publishDate || new Date();

      // Create a proper SkincareInsight instance with published status
      const insightToSave = new SkincareInsight({
        ...insight,
        status: "published",
        publishDate: publishDate,
        createdBy: insight.createdBy || user.uid,
        updatedBy: user.uid,
        metaTitle: insight.metaTitle || insight.title,
        metaDescription: insight.metaDescription || insight.description,
      });

      await insightToSave.save();
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
    { id: "basic", name: "Basic Info", icon: "📝" },
    { id: "content", name: "Content", icon: "📄" },
    { id: "media", name: "Media", icon: "🖼️" },
    { id: "targeting", name: "Targeting", icon: "🎯" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading insight...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Insight" : "Create New Insight"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing
                ? "Update your skincare insight"
                : "Create a new article or video for the mobile app"}
            </p>
          </div>
          <button
            onClick={() => navigate("/skincare-insights")}
            className="text-gray-600 hover:text-gray-900 transition-colors"
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
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={insight.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={getFieldClassName("title")}
                    placeholder="Enter a compelling title..."
                    required
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.title}
                    </p>
                  )}
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
                    placeholder="Brief description that will appear in the app..."
                    required
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.description}
                    </p>
                  )}
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
                    Author *
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={insight.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Content *
                </label>
                <textarea
                  value={insight.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={15}
                  className={getFieldClassName("content")}
                  placeholder="Write your full article content here. You can use markdown formatting..."
                  required
                />
                {fieldErrors.content && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.content}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Supports markdown formatting. Minimum 50 characters required.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags *
                </label>
                <input
                  type="text"
                  value={insight.tags.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag)
                    )
                  }
                  className={getFieldClassName("tags")}
                  placeholder="skincare, routine, tips (comma separated)"
                  required
                />
                {fieldErrors.tags && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.tags}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Enter tags separated by commas. At least one tag is required.
                </p>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Media is optional for articles. You can
                  add both images and videos to create rich, engaging content.
                  Articles can include text + image + video combinations.
                </p>
                {(insight.imageUrl || insight.videoUrl) && (
                  <div className="mt-3 flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-800">
                      Current Media:
                    </span>
                    {insight.imageUrl && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Image
                      </span>
                    )}
                    {insight.videoUrl && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ✓ Video
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "image")}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  {uploading && (
                    <div className="flex items-center mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-blue-600">
                        Uploading...
                      </span>
                    </div>
                  )}
                  <div className="text-center text-gray-500">or</div>
                  <input
                    type="url"
                    value={insight.imageUrl}
                    onChange={(e) =>
                      handleInputChange("imageUrl", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {insight.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={insight.imageUrl}
                      alt="Preview"
                      className="w-48 h-32 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-center text-gray-500">or</div>
                  <input
                    type="url"
                    value={insight.videoUrl}
                    onChange={(e) =>
                      handleInputChange("videoUrl", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=... or upload a video file"
                  />
                </div>
              </div>
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
                  className={`grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-md border ${
                    fieldErrors.skinTypes
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  {SKIN_TYPES.map((type) => (
                    <label key={type.value} className="flex items-center">
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
                      <span className="ml-2 text-sm text-gray-700">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SKIN_CONCERNS.map((concern) => (
                    <label key={concern.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={insight.skinConcerns.includes(concern.value)}
                        onChange={(e) =>
                          handleArrayChange(
                            "skinConcerns",
                            concern.value,
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {concern.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      insight.publishDate
                        ? insight.publishDate.toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "publishDate",
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    className={getFieldClassName("publishDate")}
                    required
                  />
                  {fieldErrors.publishDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.publishDate}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Required for publishing articles
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      insight.scheduledPublishDate
                        ? insight.scheduledPublishDate
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "scheduledPublishDate",
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    className={getFieldClassName("scheduledPublishDate")}
                  />
                  {fieldErrors.scheduledPublishDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.scheduledPublishDate}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {insight.scheduledPublishDate ? (
                      <>
                        Will publish:{" "}
                        {SchedulingService.formatScheduleDate(
                          insight.scheduledPublishDate
                        )}
                        <br />
                        Time remaining:{" "}
                        {SchedulingService.getTimeUntilPublish(
                          insight.scheduledPublishDate
                        )}
                      </>
                    ) : (
                      "Set a future date and time to schedule automatic publishing"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={insight.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={insight.isFeatured}
                    onChange={(e) =>
                      handleInputChange("isFeatured", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={insight.keywords.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "keywords",
                      e.target.value
                        .split(",")
                        .map((keyword) => keyword.trim())
                        .filter((keyword) => keyword)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="skincare, beauty, routine (comma separated)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Keywords help users find your content through search
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Product Names
                </label>
                <input
                  type="text"
                  value={insight.relatedProducts.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "relatedProducts",
                      e.target.value
                        .split(",")
                        .map((name) => name.trim())
                        .filter((name) => name)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="CeraVe Cleanser, Neutrogena Moisturizer (comma separated)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter product names that are related to this article
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Insight Titles
                </label>
                <input
                  type="text"
                  value={insight.relatedInsights.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "relatedInsights",
                      e.target.value
                        .split(",")
                        .map((title) => title.trim())
                        .filter((title) => title)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Morning Skincare Routine, Best Moisturizers (comma separated)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter titles of other insights that are related to this
                  article
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/skincare-insights")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleSaveAsDraft()}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>

            <button
              type="button"
              onClick={() => handlePublish()}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish Article"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SkincareInsightForm;
