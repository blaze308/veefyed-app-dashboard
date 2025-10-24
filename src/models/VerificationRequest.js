/**
 * VerificationRequest Model
 * Represents a product verification request with comprehensive details including images and status
 * Corresponds to the Dart VerificationRequest model from the mobile app
 */
export class VerificationRequest {
  constructor({
    id = null,
    ticketNumber = null, // Manual ticket ID format: #10001000, #10002000, etc.
    userId,
    userEmail,
    barcode,
    batchNumber,
    brandName,
    productName,
    storeName,
    category,
    country,
    countryCode,
    additionalNotes = null,
    // Image URLs from Firebase Storage
    frontImageUrl,
    sideImageUrl,
    backImageUrl,
    topBottomImageUrl,
    batchNumberImageUrl,
    // Status and metadata
    status = VerificationStatus.PENDING,
    createdAt,
    updatedAt = null,
    adminNotes = null,
    verificationResult = null,
  }) {
    this.id = id;
    this.ticketNumber = ticketNumber;
    this.userId = userId;
    this.userEmail = userEmail;
    this.barcode = barcode;
    this.batchNumber = batchNumber;
    this.brandName = brandName;
    this.productName = productName;
    this.storeName = storeName;
    this.category = category;
    this.country = country;
    this.countryCode = countryCode;
    this.additionalNotes = additionalNotes;
    this.frontImageUrl = frontImageUrl;
    this.sideImageUrl = sideImageUrl;
    this.backImageUrl = backImageUrl;
    this.topBottomImageUrl = topBottomImageUrl;
    this.batchNumberImageUrl = batchNumberImageUrl;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.adminNotes = adminNotes;
    this.verificationResult = verificationResult;
  }

  /**
   * Create VerificationRequest from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new VerificationRequest({
      id: doc.id,
      ticketNumber: data.ticketNumber,
      userId: data.userId || "",
      userEmail: data.userEmail || "",
      barcode: data.barcode || "",
      batchNumber: data.batchNumber || "",
      brandName: data.brandName || "",
      productName: data.productName || "",
      storeName: data.storeName || "",
      category: data.category || "",
      country: data.country || "",
      countryCode: data.countryCode || "",
      additionalNotes: data.additionalNotes,
      frontImageUrl: data.frontImageUrl || "",
      sideImageUrl: data.sideImageUrl || "",
      backImageUrl: data.backImageUrl || "",
      topBottomImageUrl: data.topBottomImageUrl || "",
      batchNumberImageUrl: data.batchNumberImageUrl || "",
      status:
        VerificationStatus.fromString(data.status) ||
        VerificationStatus.PENDING,
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
      verificationResult: data.verificationResult,
    });
  }

  /**
   * Create VerificationRequest from JSON (for API responses)
   */
  static fromJson(json, documentId = null) {
    return new VerificationRequest({
      id: documentId || json.id,
      ticketNumber: json.ticketNumber,
      userId: json.userId || "",
      userEmail: json.userEmail || "",
      barcode: json.barcode || "",
      batchNumber: json.batchNumber || "",
      brandName: json.brandName || "",
      productName: json.productName || "",
      storeName: json.storeName || "",
      category: json.category || "",
      country: json.country || "",
      countryCode: json.countryCode || "",
      additionalNotes: json.additionalNotes,
      frontImageUrl: json.frontImageUrl || "",
      sideImageUrl: json.sideImageUrl || "",
      backImageUrl: json.backImageUrl || "",
      topBottomImageUrl: json.topBottomImageUrl || "",
      batchNumberImageUrl: json.batchNumberImageUrl || "",
      status:
        VerificationStatus.fromString(json.status) ||
        VerificationStatus.PENDING,
      createdAt: json.createdAt?.toDate
        ? json.createdAt.toDate()
        : new Date(json.createdAt),
      updatedAt: json.updatedAt?.toDate
        ? json.updatedAt.toDate()
        : json.updatedAt
        ? new Date(json.updatedAt)
        : null,
      adminNotes: json.adminNotes,
      verificationResult: json.verificationResult,
    });
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      ...(this.id && { id: this.id }),
      ...(this.ticketNumber && { ticketNumber: this.ticketNumber }),
      userId: this.userId,
      userEmail: this.userEmail,
      barcode: this.barcode,
      batchNumber: this.batchNumber,
      brandName: this.brandName,
      productName: this.productName,
      storeName: this.storeName,
      category: this.category,
      country: this.country,
      countryCode: this.countryCode,
      additionalNotes: this.additionalNotes,
      frontImageUrl: this.frontImageUrl,
      sideImageUrl: this.sideImageUrl,
      backImageUrl: this.backImageUrl,
      topBottomImageUrl: this.topBottomImageUrl,
      batchNumberImageUrl: this.batchNumberImageUrl,
      status: this.status.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      adminNotes: this.adminNotes,
      verificationResult: this.verificationResult,
    };
  }

  /**
   * Convert to JSON format
   */
  toJson() {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      userId: this.userId,
      userEmail: this.userEmail,
      barcode: this.barcode,
      batchNumber: this.batchNumber,
      brandName: this.brandName,
      productName: this.productName,
      storeName: this.storeName,
      category: this.category,
      country: this.country,
      countryCode: this.countryCode,
      additionalNotes: this.additionalNotes,
      frontImageUrl: this.frontImageUrl,
      sideImageUrl: this.sideImageUrl,
      backImageUrl: this.backImageUrl,
      topBottomImageUrl: this.topBottomImageUrl,
      batchNumberImageUrl: this.batchNumberImageUrl,
      status: this.status.value,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      adminNotes: this.adminNotes,
      verificationResult: this.verificationResult,
    };
  }

  /**
   * Copy with method for immutable updates
   */
  copyWith({
    id,
    ticketNumber,
    userId,
    userEmail,
    barcode,
    batchNumber,
    brandName,
    productName,
    storeName,
    category,
    country,
    countryCode,
    additionalNotes,
    frontImageUrl,
    sideImageUrl,
    backImageUrl,
    topBottomImageUrl,
    batchNumberImageUrl,
    status,
    createdAt,
    updatedAt,
    adminNotes,
    verificationResult,
  }) {
    return new VerificationRequest({
      id: id ?? this.id,
      ticketNumber: ticketNumber ?? this.ticketNumber,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      barcode: barcode ?? this.barcode,
      batchNumber: batchNumber ?? this.batchNumber,
      brandName: brandName ?? this.brandName,
      productName: productName ?? this.productName,
      storeName: storeName ?? this.storeName,
      category: category ?? this.category,
      country: country ?? this.country,
      countryCode: countryCode ?? this.countryCode,
      additionalNotes: additionalNotes ?? this.additionalNotes,
      frontImageUrl: frontImageUrl ?? this.frontImageUrl,
      sideImageUrl: sideImageUrl ?? this.sideImageUrl,
      backImageUrl: backImageUrl ?? this.backImageUrl,
      topBottomImageUrl: topBottomImageUrl ?? this.topBottomImageUrl,
      batchNumberImageUrl: batchNumberImageUrl ?? this.batchNumberImageUrl,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      adminNotes: adminNotes ?? this.adminNotes,
      verificationResult: verificationResult ?? this.verificationResult,
    });
  }

  /**
   * Get all image URLs as an array
   */
  get allImageUrls() {
    return [
      this.frontImageUrl,
      this.sideImageUrl,
      this.backImageUrl,
      this.topBottomImageUrl,
      this.batchNumberImageUrl,
    ].filter((url) => url && url.trim() !== "");
  }

  /**
   * Check if request has all required images
   */
  get hasAllImages() {
    return this.allImageUrls.length === 5;
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
   * String representation
   */
  toString() {
    return `VerificationRequest(id: ${this.id}, ticketNumber: ${this.ticketNumber}, userId: ${this.userId}, productName: ${this.productName}, status: ${this.status.value})`;
  }

  /**
   * Equality comparison
   */
  equals(other) {
    if (!(other instanceof VerificationRequest)) return false;
    return (
      this.id === other.id &&
      this.userId === other.userId &&
      this.barcode === other.barcode &&
      this.batchNumber === other.batchNumber
    );
  }
}

/**
 * Verification Status Enum equivalent - simplified to match Review system
 */
export class VerificationStatus {
  static PENDING = new VerificationStatus(
    "pending",
    "Pending",
    "Your verification request has been submitted and is waiting to be reviewed."
  );
  static APPROVED = new VerificationStatus(
    "approved",
    "Approved",
    "Your verification request has been approved."
  );
  static REJECTED = new VerificationStatus(
    "rejected",
    "Rejected",
    "Your verification request has been rejected. Please check admin notes for details."
  );

  constructor(value, displayName, description) {
    this.value = value;
    this.displayName = displayName;
    this.description = description;
  }

  /**
   * Get all status values
   */
  static get values() {
    return [
      VerificationStatus.PENDING,
      VerificationStatus.APPROVED,
      VerificationStatus.REJECTED,
    ];
  }

  /**
   * Create VerificationStatus from string value
   */
  static fromString(value) {
    return (
      VerificationStatus.values.find((status) => status.value === value) ||
      VerificationStatus.PENDING
    );
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
      this.value === "approved" ||
      this.value === "rejected"
    );
  }

  /**
   * Check if status is final (no further changes expected)
   */
  get isFinal() {
    return this.value === "approved" || this.value === "rejected";
  }

  toString() {
    return this.value;
  }
}

/**
 * Verification request validation helper
 */
export const validateVerificationRequest = (requestData) => {
  const errors = [];

  if (!requestData.userId) errors.push("User ID is required");
  if (!requestData.userEmail) errors.push("User email is required");
  if (!requestData.barcode) errors.push("Barcode is required");
  if (!requestData.batchNumber) errors.push("Batch number is required");
  if (!requestData.brandName) errors.push("Brand name is required");
  if (!requestData.productName) errors.push("Product name is required");
  if (!requestData.storeName) errors.push("Store name is required");
  if (!requestData.category) errors.push("Category is required");
  if (!requestData.country) errors.push("Country is required");
  if (!requestData.countryCode) errors.push("Country code is required");
  if (!requestData.frontImageUrl) errors.push("Front image is required");
  if (!requestData.sideImageUrl) errors.push("Side image is required");
  if (!requestData.backImageUrl) errors.push("Back image is required");
  if (!requestData.topBottomImageUrl)
    errors.push("Top/Bottom image is required");
  if (!requestData.batchNumberImageUrl)
    errors.push("Batch number image is required");
  if (!requestData.createdAt) errors.push("Created date is required");

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
    const statusObj = VerificationStatus.fromString(status);
    return statusObj.displayName;
  }
  return status?.displayName || "Unknown";
};

/**
 * Helper function to get status color
 */
export const getStatusColor = (status) => {
  if (typeof status === "string") {
    const statusObj = VerificationStatus.fromString(status);
    return statusObj.statusColor;
  }
  return status?.statusColor || "bg-gray-100 text-gray-800";
};

export default VerificationRequest;
