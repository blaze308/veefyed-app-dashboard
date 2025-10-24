/**
 * Review Status Enum - object-based approach to match Reports and Verification Requests
 */
export class ReviewStatus {
  static PENDING = new ReviewStatus("pending", "Pending");
  static APPROVED = new ReviewStatus("approved", "Approved");
  static REJECTED = new ReviewStatus("rejected", "Rejected");

  constructor(value, displayName) {
    this.value = value;
    this.displayName = displayName;
  }

  /**
   * Get all status values
   */
  static get values() {
    return [ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED];
  }

  /**
   * Create ReviewStatus from string value
   */
  static fromString(value) {
    return (
      ReviewStatus.values.find((status) => status.value === value) ||
      ReviewStatus.PENDING
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
 * Review Model
 * Represents a product review with comprehensive details including effects, images, and verification status
 */
export class Review {
  constructor({
    id = null,
    userId,
    userEmail,
    productId,
    productName,
    brandName,
    category,
    rating, // 1-5 stars
    comment,
    feedback = null, // Admin feedback or response
    imageUrls = [], // Optional review images
    skinEffects = [], // Selected skin effects
    longTermEffects = [], // Long-term benefits
    timeToResults = null, // Time period to see results
    usedWithOtherProduct = false, // Used with another product
    otherProductName = null, // Name of other product if used
    createdAt,
    updatedAt = null,
    status = ReviewStatus.PENDING, // Review status (pending, approved, rejected)
    isVerified = false, // If the review is verified by admin (kept for backward compatibility)
    productDetails = null, // Additional product info
  }) {
    this.id = id;
    this.userId = userId;
    this.userEmail = userEmail;
    this.productId = productId;
    this.productName = productName;
    this.brandName = brandName;
    this.category = category;
    this.rating = rating;
    this.comment = comment;
    this.feedback = feedback;
    this.imageUrls = imageUrls;
    this.skinEffects = skinEffects;
    this.longTermEffects = longTermEffects;
    this.timeToResults = timeToResults;
    this.usedWithOtherProduct = usedWithOtherProduct;
    this.otherProductName = otherProductName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.status = status;
    this.isVerified = isVerified;
    this.productDetails = productDetails;
  }

  /**
   * Create Review from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Review({
      id: doc.id,
      userId: data.userId,
      userEmail: data.userEmail,
      productId: data.productId,
      productName: data.productName,
      brandName: data.brandName,
      category: data.category,
      rating: parseFloat(data.rating) || 0,
      comment: data.comment,
      feedback: data.feedback,
      imageUrls: data.imageUrls || [],
      skinEffects: data.skinEffects || [],
      longTermEffects: data.longTermEffects || [],
      timeToResults: data.timeToResults,
      usedWithOtherProduct: data.usedWithOtherProduct || false,
      otherProductName: data.otherProductName,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt
        ? new Date(data.updatedAt)
        : null,
      status: ReviewStatus.fromString(data.status) || ReviewStatus.PENDING,
      isVerified: data.isVerified || false,
      productDetails: data.productDetails,
    });
  }

  /**
   * Create Review from JSON (for API responses)
   */
  static fromJson(json) {
    return new Review({
      id: json.id,
      userId: json.userId,
      userEmail: json.userEmail,
      productId: json.productId,
      productName: json.productName,
      brandName: json.brandName,
      category: json.category,
      rating: parseFloat(json.rating) || 0,
      comment: json.comment,
      feedback: json.feedback,
      imageUrls: json.imageUrls || [],
      skinEffects: json.skinEffects || [],
      longTermEffects: json.longTermEffects || [],
      timeToResults: json.timeToResults,
      usedWithOtherProduct: json.usedWithOtherProduct || false,
      otherProductName: json.otherProductName,
      createdAt: new Date(json.createdAt),
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : null,
      status: ReviewStatus.fromString(json.status) || ReviewStatus.PENDING,
      isVerified: json.isVerified || false,
      productDetails: json.productDetails,
    });
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      userId: this.userId,
      userEmail: this.userEmail,
      productId: this.productId,
      productName: this.productName,
      brandName: this.brandName,
      category: this.category,
      rating: this.rating,
      comment: this.comment,
      feedback: this.feedback,
      imageUrls: this.imageUrls,
      skinEffects: this.skinEffects,
      longTermEffects: this.longTermEffects,
      timeToResults: this.timeToResults,
      usedWithOtherProduct: this.usedWithOtherProduct,
      otherProductName: this.otherProductName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
      isVerified: this.isVerified,
      productDetails: this.productDetails,
    };
  }

  /**
   * Convert to JSON format
   */
  toJson() {
    return {
      id: this.id,
      userId: this.userId,
      userEmail: this.userEmail,
      productId: this.productId,
      productName: this.productName,
      brandName: this.brandName,
      category: this.category,
      rating: this.rating,
      comment: this.comment,
      feedback: this.feedback,
      imageUrls: this.imageUrls,
      skinEffects: this.skinEffects,
      longTermEffects: this.longTermEffects,
      timeToResults: this.timeToResults,
      usedWithOtherProduct: this.usedWithOtherProduct,
      otherProductName: this.otherProductName,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      isVerified: this.isVerified,
      productDetails: this.productDetails,
    };
  }

  /**
   * Copy with method for immutable updates
   */
  copyWith({
    id,
    userId,
    userEmail,
    productId,
    productName,
    brandName,
    category,
    rating,
    comment,
    feedback,
    imageUrls,
    skinEffects,
    longTermEffects,
    timeToResults,
    usedWithOtherProduct,
    otherProductName,
    createdAt,
    updatedAt,
    isVerified,
    productDetails,
  }) {
    return new Review({
      id: id ?? this.id,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      brandName: brandName ?? this.brandName,
      category: category ?? this.category,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      feedback: feedback ?? this.feedback,
      imageUrls: imageUrls ?? this.imageUrls,
      skinEffects: skinEffects ?? this.skinEffects,
      longTermEffects: longTermEffects ?? this.longTermEffects,
      timeToResults: timeToResults ?? this.timeToResults,
      usedWithOtherProduct: usedWithOtherProduct ?? this.usedWithOtherProduct,
      otherProductName: otherProductName ?? this.otherProductName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isVerified: isVerified ?? this.isVerified,
      productDetails: productDetails ?? this.productDetails,
    });
  }

  /**
   * Get display-friendly rating with stars
   */
  get ratingStars() {
    const fullStars = Math.floor(this.rating);
    const hasHalfStar = this.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return {
      full: fullStars,
      half: hasHalfStar,
      empty: emptyStars,
      numeric: this.rating,
    };
  }

  /**
   * Get verification status display
   */
  get verificationStatus() {
    return {
      isVerified: this.isVerified,
      label: this.isVerified ? "Approved" : "Pending",
      className: this.isVerified
        ? "bg-green-100 text-green-800"
        : "bg-yellow-100 text-yellow-800",
    };
  }

  /**
   * Check if review has images
   */
  get hasImages() {
    return this.imageUrls && this.imageUrls.length > 0;
  }

  /**
   * Check if review has skin effects
   */
  get hasSkinEffects() {
    return this.skinEffects && this.skinEffects.length > 0;
  }

  /**
   * Check if review has long-term effects
   */
  get hasLongTermEffects() {
    return this.longTermEffects && this.longTermEffects.length > 0;
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
    return `Review(id: ${this.id}, productName: ${this.productName}, rating: ${this.rating}, comment: ${this.comment})`;
  }

  /**
   * Equality comparison
   */
  equals(other) {
    if (!(other instanceof Review)) return false;
    return (
      this.id === other.id &&
      this.userId === other.userId &&
      this.productId === other.productId &&
      this.rating === other.rating
    );
  }

  /**
   * Hash code for object comparison
   */
  get hashCode() {
    return `${this.id}-${this.userId}-${this.productId}-${this.rating}`.hashCode();
  }
}

/**
 * Review Filter Enum equivalent
 */
export const ReviewFilter = {
  ALL: "all",
  BY_RATING: "byRating",
  RECENT: "recent",
  WITH_COMMENT: "withComment",
  WITH_FEEDBACK: "withFeedback",
  WITH_IMAGES: "with_images",
  WITH_EFFECTS: "with_effects",
  APPROVED: "approved",
  PENDING: "pending",
};

/**
 * Review Filter Display Names
 */
export const ReviewFilterDisplayNames = {
  [ReviewFilter.ALL]: "All",
  [ReviewFilter.BY_RATING]: "Rating",
  [ReviewFilter.RECENT]: "Recent",
  [ReviewFilter.WITH_COMMENT]: "Comment",
  [ReviewFilter.WITH_FEEDBACK]: "Feedback",
  [ReviewFilter.WITH_IMAGES]: "With Images",
  [ReviewFilter.WITH_EFFECTS]: "With Effects",
  [ReviewFilter.APPROVED]: "Approved",
  [ReviewFilter.PENDING]: "Pending",
};

/**
 * Helper function to get filter display name
 */
export const getFilterDisplayName = (filter) => {
  return ReviewFilterDisplayNames[filter] || filter;
};

/**
 * Review validation helper
 */
export const validateReview = (reviewData) => {
  const errors = [];

  if (!reviewData.userId) errors.push("User ID is required");
  if (!reviewData.userEmail) errors.push("User email is required");
  if (!reviewData.productId) errors.push("Product ID is required");
  if (!reviewData.productName) errors.push("Product name is required");
  if (!reviewData.brandName) errors.push("Brand name is required");
  if (!reviewData.category) errors.push("Category is required");
  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push("Rating must be between 1 and 5");
  }
  if (!reviewData.comment || reviewData.comment.trim().length === 0) {
    errors.push("Comment is required");
  }
  if (!reviewData.createdAt) errors.push("Created date is required");

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to get status color
 */
export const getStatusColor = (status) => {
  if (typeof status === "string") {
    const statusObj = ReviewStatus.fromString(status);
    return statusObj.statusColor;
  }
  return status?.statusColor || "bg-gray-100 text-gray-800";
};

export default Review;
