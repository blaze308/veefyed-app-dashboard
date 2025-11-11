/**
 * Report Model
 * Represents a user report submission with comprehensive details including evidence and status
 * Corresponds to the Dart Report model from the mobile app
 */
export class Report {
  constructor({
    id = null,
    userId,
    type,
    reason,
    description = null,
    issueReport = null,
    additionalDetails = null,
    evidenceFiles = [],
    evidencePhotos = [],
    status = ReportStatus.PENDING,
    createdAt,
    updatedAt = null,
    adminNotes = null,
    resolutionDetails = null,
    assignedTo = null,
    assignedToName = null,
    assignedAt = null,
  }) {
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.reason = reason;
    this.description = description;
    this.issueReport = issueReport;
    this.additionalDetails = additionalDetails;
    this.evidenceFiles = evidenceFiles;
    this.evidencePhotos = evidencePhotos;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.adminNotes = adminNotes;
    this.resolutionDetails = resolutionDetails;
    this.assignedTo = assignedTo;
    this.assignedToName = assignedToName;
    this.assignedAt = assignedAt;
  }

  /**
   * Create Report from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Report({
      id: doc.id,
      userId: data.userId || "",
      type: ReportType.fromString(data.type) || ReportType.PRODUCT,
      reason: data.reason || "",
      description: data.description,
      issueReport: data.issueReport,
      additionalDetails: data.additionalDetails,
      evidenceFiles: data.evidenceFiles || [],
      evidencePhotos: data.evidencePhotos || [],
      status: ReportStatus.fromString(data.status) || ReportStatus.PENDING,
      // Handle date fields - support both Firestore Timestamps and ISO strings
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
      adminNotes: data.adminNotes,
      resolutionDetails: data.resolutionDetails,
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      assignedAt: data.assignedAt?.toDate
        ? data.assignedAt.toDate()
        : data.assignedAt
        ? new Date(data.assignedAt)
        : null,
    });
  }

  /**
   * Create Report from JSON (for API responses)
   */
  static fromJson(json, documentId = null) {
    return new Report({
      id: documentId || json.id,
      userId: json.userId || "",
      type: ReportType.fromString(json.type) || ReportType.PRODUCT,
      reason: json.reason || "",
      description: json.description,
      issueReport: json.issueReport,
      additionalDetails: json.additionalDetails,
      evidenceFiles: json.evidenceFiles || [],
      evidencePhotos: json.evidencePhotos || [],
      status: ReportStatus.fromString(json.status) || ReportStatus.PENDING,
      createdAt: json.createdAt?.toDate
        ? json.createdAt.toDate()
        : new Date(json.createdAt),
      updatedAt: json.updatedAt?.toDate
        ? json.updatedAt.toDate()
        : json.updatedAt
        ? new Date(json.updatedAt)
        : null,
      adminNotes: json.adminNotes,
      resolutionDetails: json.resolutionDetails,
      assignedTo: json.assignedTo,
      assignedToName: json.assignedToName,
      assignedAt: json.assignedAt?.toDate
        ? json.assignedAt.toDate()
        : json.assignedAt
        ? new Date(json.assignedAt)
        : null,
    });
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      userId: this.userId,
      type: this.type.value,
      reason: this.reason,
      description: this.description,
      issueReport: this.issueReport,
      additionalDetails: this.additionalDetails,
      evidenceFiles: this.evidenceFiles,
      evidencePhotos: this.evidencePhotos,
      status: this.status.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      adminNotes: this.adminNotes,
      resolutionDetails: this.resolutionDetails,
      assignedTo: this.assignedTo,
      assignedToName: this.assignedToName,
      assignedAt: this.assignedAt,
    };
  }

  /**
   * Convert to JSON format
   */
  toJson() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type.value,
      reason: this.reason,
      description: this.description,
      issueReport: this.issueReport,
      additionalDetails: this.additionalDetails,
      evidenceFiles: this.evidenceFiles,
      evidencePhotos: this.evidencePhotos,
      status: this.status.value,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      adminNotes: this.adminNotes,
      resolutionDetails: this.resolutionDetails,
      assignedTo: this.assignedTo,
      assignedToName: this.assignedToName,
      assignedAt: this.assignedAt?.toISOString(),
    };
  }

  /**
   * Copy with method for immutable updates
   */
  copyWith({
    id,
    userId,
    type,
    reason,
    description,
    issueReport,
    additionalDetails,
    evidenceFiles,
    evidencePhotos,
    status,
    createdAt,
    updatedAt,
    adminNotes,
    resolutionDetails,
    assignedTo,
    assignedToName,
    assignedAt,
  }) {
    return new Report({
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      reason: reason ?? this.reason,
      description: description ?? this.description,
      issueReport: issueReport ?? this.issueReport,
      additionalDetails: additionalDetails ?? this.additionalDetails,
      evidenceFiles: evidenceFiles ?? this.evidenceFiles,
      evidencePhotos: evidencePhotos ?? this.evidencePhotos,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      adminNotes: adminNotes ?? this.adminNotes,
      resolutionDetails: resolutionDetails ?? this.resolutionDetails,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedToName: assignedToName ?? this.assignedToName,
      assignedAt: assignedAt ?? this.assignedAt,
    });
  }

  /**
   * Check if this report has evidence uploaded
   */
  get hasEvidence() {
    return this.evidenceFiles.length > 0 || this.evidencePhotos.length > 0;
  }

  /**
   * Check if this is an "Other" type report that requires additional validation
   */
  get isOtherTypeReport() {
    return this.reason === "Other (Please describe below)";
  }

  /**
   * Get total evidence count
   */
  get totalEvidenceCount() {
    return this.evidenceFiles.length + this.evidencePhotos.length;
  }

  /**
   * Check if both required evidence types are present
   */
  get hasRequiredEvidence() {
    return this.evidenceFiles.length > 0 && this.evidencePhotos.length > 0;
  }

  /**
   * Get all evidence URLs as an array
   */
  get allEvidenceUrls() {
    return [...this.evidenceFiles, ...this.evidencePhotos].filter(
      (url) => url && url.trim() !== ""
    );
  }

  /**
   * Check if report is still pending
   */
  get isPending() {
    return this.status.value === "pending";
  }

  /**
   * Check if report is under review
   */
  get isUnderReview() {
    return this.status.value === "underReview";
  }

  /**
   * Check if report is resolved
   */
  get isResolved() {
    return this.status.value === "resolved";
  }

  /**
   * Check if report is rejected
   */
  get isRejected() {
    return this.status.value === "rejected";
  }

  /**
   * Check if report is assigned
   */
  get isAssigned() {
    return !!this.assignedTo;
  }

  /**
   * Get formatted assignment date
   */
  get formattedAssignedAt() {
    if (!this.assignedAt) return null;
    return {
      date: this.assignedAt.toLocaleDateString(),
      time: this.assignedAt.toLocaleTimeString(),
      full: this.assignedAt.toLocaleString(),
    };
  }

  /**
   * Get formatted creation date
   */
  get formattedCreatedAt() {
    return {
      date: this.createdAt.toLocaleDateString(),
      time: this.createdAt.toLocaleTimeString(),
      full: this.createdAt.toLocaleString(),
    };
  }

  /**
   * Get formatted update date
   */
  get formattedUpdatedAt() {
    if (!this.updatedAt) return null;
    return {
      date: this.updatedAt.toLocaleDateString(),
      time: this.updatedAt.toLocaleTimeString(),
      full: this.updatedAt.toLocaleString(),
    };
  }

  /**
   * Validate this report instance
   */
  validate() {
    const errors = [];

    // Validate user ID
    if (!this.userId || this.userId.trim() === "") {
      errors.push("User ID is required");
    }

    // Validate report type
    if (!this.type) {
      errors.push("Report type is required");
    }

    // Validate reason
    if (!this.reason || this.reason.trim() === "") {
      errors.push("Reason is required");
    } else if (!Report.VALID_REASONS.includes(this.reason)) {
      errors.push("Invalid reason selected");
    }

    // Validate "Other" reason requirements
    if (this.isOtherTypeReport) {
      if (!this.description || this.description.trim() === "") {
        errors.push('Description is required for "Other" reports');
      }
    }

    // Validate evidence upload (both document and image are mandatory)
    if (this.evidenceFiles.length === 0) {
      errors.push("Document evidence is required");
    }

    if (this.evidencePhotos.length === 0) {
      errors.push("Image evidence is required");
    }

    // Validate evidence file URLs are not empty
    if (this.evidenceFiles.some((file) => !file || file.trim() === "")) {
      errors.push("Evidence file URLs cannot be empty");
    }

    if (this.evidencePhotos.some((photo) => !photo || photo.trim() === "")) {
      errors.push("Evidence photo URLs cannot be empty");
    }

    return errors;
  }

  /**
   * Check if this report is valid
   */
  get isValid() {
    return this.validate().length === 0;
  }

  /**
   * String representation
   */
  toString() {
    return `Report(id: ${this.id}, userId: ${this.userId}, type: ${this.type.value}, reason: ${this.reason}, status: ${this.status.value})`;
  }

  /**
   * Equality comparison
   */
  equals(other) {
    if (!(other instanceof Report)) return false;
    return (
      this.id === other.id &&
      this.userId === other.userId &&
      this.type.value === other.type.value &&
      this.reason === other.reason &&
      this.status.value === other.status.value
    );
  }
}

/**
 * Report Type Enum
 */
export class ReportType {
  static PRODUCT = new ReportType("product", "Product");
  static SELLER = new ReportType("seller", "Seller");

  constructor(value, displayName) {
    this.value = value;
    this.displayName = displayName;
  }

  /**
   * Get all report type values
   */
  static get values() {
    return [ReportType.PRODUCT, ReportType.SELLER];
  }

  /**
   * Create ReportType from string value
   */
  static fromString(value) {
    return (
      ReportType.values.find((type) => type.value === value) ||
      ReportType.PRODUCT
    );
  }

  /**
   * Get icon for the report type
   */
  get icon() {
    switch (this.value) {
      case "product":
        return "📦";
      case "seller":
        return "🏪";
      default:
        return "📋";
    }
  }

  toString() {
    return this.value;
  }
}

/**
 * Report Status Enum - standardized to match Review and Verification Request system
 */
export class ReportStatus {
  static PENDING = new ReportStatus("pending", "Pending");
  static APPROVED = new ReportStatus("approved", "Approved");
  static REJECTED = new ReportStatus("rejected", "Rejected");

  constructor(value, displayName) {
    this.value = value;
    this.displayName = displayName;
  }

  /**
   * Get all status values
   */
  static get values() {
    return [ReportStatus.PENDING, ReportStatus.APPROVED, ReportStatus.REJECTED];
  }

  /**
   * Create ReportStatus from string value
   */
  static fromString(value) {
    // Handle legacy status values
    switch (value?.toLowerCase()) {
      case "resolved":
      case "approved":
        return ReportStatus.APPROVED;
      case "rejected":
        return ReportStatus.REJECTED;
      case "pending":
      case "underreview":
      case "under_review":
      default:
        return ReportStatus.PENDING;
    }
  }

  /**
   * Get status color for UI display
   */
  get statusColor() {
    switch (this.value) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  /**
   * Check if status allows editing
   */
  get canEdit() {
    return (
      this.value === "pending" ||
      this.value === "underReview" ||
      this.value === "resolved" ||
      this.value === "rejected"
    );
  }

  /**
   * Check if status is final (no further changes expected)
   */
  get isFinal() {
    return this.value === "resolved" || this.value === "rejected";
  }

  toString() {
    return this.value;
  }
}

/**
 * List of valid report reasons
 */
Report.VALID_REASONS = [
  "Selling Fake or Counterfeit Products",
  "Misleading Business or Contact Information",
  "Used Expired or Unsafe Products",
  "Unprofessional or Inappropriate Behavior",
  "Fake or Incorrect Business Location",
  "Overpriced or Hidden Charges",
  "No Delivery / Ghost Seller",
  "Other (Please describe below)",
];

/**
 * Report validation helper
 */
export const validateReport = (reportData) => {
  const errors = [];

  if (!reportData.userId) errors.push("User ID is required");
  if (!reportData.type) errors.push("Report type is required");
  if (!reportData.reason) errors.push("Reason is required");
  if (!Report.VALID_REASONS.includes(reportData.reason)) {
    errors.push("Invalid reason selected");
  }
  if (!reportData.evidenceFiles || reportData.evidenceFiles.length === 0) {
    errors.push("Document evidence is required");
  }
  if (!reportData.evidencePhotos || reportData.evidencePhotos.length === 0) {
    errors.push("Image evidence is required");
  }
  if (!reportData.createdAt) errors.push("Created date is required");

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to get status display name
 */
export const getStatusDisplayName = (status) => {
  if (typeof status === "string") {
    const statusObj = ReportStatus.fromString(status);
    return statusObj.displayName;
  }
  return status?.displayName || "Unknown";
};

/**
 * Helper function to get status color
 */
export const getStatusColor = (status) => {
  if (typeof status === "string") {
    const statusObj = ReportStatus.fromString(status);
    return statusObj.statusColor;
  }
  return status?.statusColor || "bg-gray-100 text-gray-800";
};

/**
 * Helper function to get report type display name
 */
export const getTypeDisplayName = (type) => {
  if (typeof type === "string") {
    const typeObj = ReportType.fromString(type);
    return typeObj.displayName;
  }
  return type?.displayName || "Unknown";
};

export default Report;
