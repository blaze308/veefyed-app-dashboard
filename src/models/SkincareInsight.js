import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export class SkincareInsight {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || "";
    this.content = data.content || "";
    this.description = data.description || "";
    this.author = data.author || "";
    this.authorImage = data.authorImage || "";
    this.contentType = "article"; // All content is articles with optional media
    this.category = data.category || "skincare";
    this.tags = data.tags || [];
    this.skinTypes = data.skinTypes || []; // oily, dry, combination, sensitive, normal
    this.skinConcerns = data.skinConcerns || []; // acne, aging, hyperpigmentation, etc.
    this.readTimeMinutes = data.readTimeMinutes || 3;
    // Legacy single media support (for backward compatibility)
    this.imageUrl = data.imageUrl || "";
    this.videoUrl = data.videoUrl || "";
    this.thumbnailUrl = data.thumbnailUrl || "";

    // New multiple media support
    this.images = data.images || []; // Array of image objects: {url, caption, alt}
    this.videos = data.videos || []; // Array of video objects: {url, caption, thumbnail, type}
    this.image_urls = data.image_urls || []; // Array of image URLs for Firestore storage
    this.video_urls = data.video_urls || []; // Array of video URLs for Firestore storage
    this.featuredImage = data.featuredImage || ""; // Main featured image URL
    this.metaTitle = data.metaTitle || "";
    this.metaDescription = data.metaDescription || "";
    this.keywords = data.keywords || [];
    this.relatedProducts = data.relatedProducts || []; // Array of product IDs
    this.relatedInsights = data.relatedInsights || []; // Array of insight IDs
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isFeatured = data.isFeatured !== undefined ? data.isFeatured : false;
    this.isDeleted = data.isDeleted !== undefined ? data.isDeleted : false;
    this.publishDate = data.publishDate || null;
    this.status = data.status || "draft"; // draft, published
    this.viewCount = data.viewCount || 0;
    this.likeCount = data.likeCount || 0;
    this.shareCount = data.shareCount || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.createdBy = data.createdBy || "";
    this.updatedBy = data.updatedBy || "";
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length < 5) {
      errors.push("Title must be at least 5 characters long");
    }

    if (!this.content || this.content.trim().length < 50) {
      errors.push("Content must be at least 50 characters long");
    }

    if (!this.description || this.description.trim().length < 20) {
      errors.push("Description must be at least 20 characters long");
    }

    if (!this.author || this.author.trim().length < 2) {
      errors.push("Author name is required");
    }

    if (!this.category || this.category.trim().length === 0) {
      errors.push("Category is required");
    }

    if (this.readTimeMinutes < 1 || this.readTimeMinutes > 60) {
      errors.push("Read time must be between 1 and 60 minutes");
    }

    // Media validation
    if (this.images.length > 5) {
      errors.push("Maximum 5 images allowed per article");
    }

    if (this.videos.length > 3) {
      errors.push("Maximum 3 videos allowed per article");
    }

    if (this.image_urls && this.image_urls.length > 5) {
      errors.push("Maximum 5 image URLs allowed per article");
    }

    if (this.video_urls && this.video_urls.length > 3) {
      errors.push("Maximum 3 video URLs allowed per article");
    }

    if (this.tags.length === 0) {
      errors.push("At least one tag is required");
    }

    if (this.skinTypes.length === 0) {
      errors.push("At least one skin type must be selected");
    }

    return errors;
  }

  // Convert to Firestore document
  toFirestore() {
    const data = {
      title: this.title,
      content: this.content,
      description: this.description,
      author: this.author,
      authorImage: this.authorImage,
      contentType: this.contentType,
      category: this.category,
      tags: this.tags,
      skinTypes: this.skinTypes,
      skinConcerns: this.skinConcerns,
      readTimeMinutes: this.readTimeMinutes,
      // Legacy media fields
      imageUrl: this.imageUrl,
      videoUrl: this.videoUrl,
      thumbnailUrl: this.thumbnailUrl,

      // New multiple media fields
      images: this.images,
      videos: this.videos,
      image_urls: this.image_urls,
      video_urls: this.video_urls,
      featuredImage: this.featuredImage,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      keywords: this.keywords,
      relatedProducts: this.relatedProducts,
      relatedInsights: this.relatedInsights,
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      isDeleted: this.isDeleted,
      publishDate: this.publishDate,
      status: this.status,
      viewCount: this.viewCount,
      likeCount: this.likeCount,
      shareCount: this.shareCount,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      updatedAt: serverTimestamp(),
    };

    // Only add createdAt for new documents
    if (!this.id) {
      data.createdAt = serverTimestamp();
    }

    return data;
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new SkincareInsight({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      publishDate: data.publishDate?.toDate(),
    });
  }

  // Save to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    const collectionRef = collection(db, "skincare_insights");

    if (this.id) {
      // Update existing document
      const docRef = doc(db, "skincare_insights", this.id);
      await updateDoc(docRef, this.toFirestore());
      return this.id;
    } else {
      // Create new document
      const docRef = await addDoc(collectionRef, this.toFirestore());
      this.id = docRef.id;
      return this.id;
    }
  }

  // Soft delete - mark as deleted but keep in database
  async softDelete() {
    if (!this.id) {
      throw new Error("Cannot delete insight without ID");
    }

    this.isDeleted = true;
    this.isActive = false;
    this.updatedAt = serverTimestamp();

    const docRef = doc(db, "skincare_insights", this.id);
    await updateDoc(docRef, {
      isDeleted: true,
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  }

  // Restore from soft delete
  async restore() {
    if (!this.id) {
      throw new Error("Cannot restore insight without ID");
    }

    this.isDeleted = false;
    this.isActive = true;
    this.updatedAt = serverTimestamp();

    const docRef = doc(db, "skincare_insights", this.id);
    await updateDoc(docRef, {
      isDeleted: false,
      isActive: true,
      updatedAt: serverTimestamp(),
    });
  }

  // Hard delete from Firestore (admin only)
  async delete() {
    if (!this.id) {
      throw new Error("Cannot delete insight without ID");
    }

    const docRef = doc(db, "skincare_insights", this.id);
    await deleteDoc(docRef);
  }

  // Static methods for querying
  static async getAll(options = {}) {
    const {
      orderByField = "createdAt",
      orderDirection = "desc",
      limitCount = null,
      status = null,
      isActive = null,
    } = options;

    let q = query(collection(db, "skincare_insights"));

    // Add filters
    if (status) {
      q = query(q, where("status", "==", status));
    }

    if (isActive !== null) {
      q = query(q, where("isActive", "==", isActive));
    }

    // Add ordering
    q = query(q, orderBy(orderByField, orderDirection));

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => SkincareInsight.fromFirestore(doc));
  }

  static async getById(id) {
    const docRef = doc(db, "skincare_insights", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return SkincareInsight.fromFirestore(docSnap);
    } else {
      throw new Error("Insight not found");
    }
  }

  static async getByCategory(category, options = {}) {
    const {
      orderByField = "createdAt",
      orderDirection = "desc",
      limitCount = null,
    } = options;

    let q = query(
      collection(db, "skincare_insights"),
      where("category", "==", category),
      where("isActive", "==", true)
    );

    q = query(q, orderBy(orderByField, orderDirection));

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => SkincareInsight.fromFirestore(doc));
  }

  static async getByStatus(status, options = {}) {
    const {
      orderByField = "createdAt",
      orderDirection = "desc",
      limitCount = null,
    } = options;

    let q = query(
      collection(db, "skincare_insights"),
      where("status", "==", status)
    );

    q = query(q, orderBy(orderByField, orderDirection));

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => SkincareInsight.fromFirestore(doc));
  }

  static async getFeatured(limitCount = 5) {
    const q = query(
      collection(db, "skincare_insights"),
      where("isFeatured", "==", true),
      where("isActive", "==", true),
      where("status", "==", "published"),
      orderBy("publishDate", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => SkincareInsight.fromFirestore(doc));
  }

  // Helper methods for formatting
  getFormattedPublishDate() {
    if (!this.publishDate) return "Not published";

    return this.publishDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getReadTimeText() {
    return `${this.readTimeMinutes} min${
      this.readTimeMinutes !== 1 ? "s" : ""
    } read`;
  }

  getStatusBadgeColor() {
    switch (this.status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Clone method for editing
  clone() {
    return new SkincareInsight({
      ...this,
      id: null, // Remove ID for cloning
      createdAt: null,
      updatedAt: null,
    });
  }
}

// Export constants for use in components
export const CONTENT_TYPES = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
];

export const CATEGORIES = [
  { value: "skincare", label: "Skincare" },
  { value: "ingredients", label: "Ingredients" },
  { value: "routines", label: "Routines" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "reviews", label: "Product Reviews" },
  { value: "trends", label: "Beauty Trends" },
];

export const SKIN_TYPES = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
];

export const SKIN_CONCERNS = [
  { value: "acne", label: "Acne" },
  { value: "aging", label: "Aging" },
  { value: "hyperpigmentation", label: "Hyperpigmentation" },
  { value: "dryness", label: "Dryness" },
  { value: "sensitivity", label: "Sensitivity" },
  { value: "dullness", label: "Dullness" },
  { value: "dark_spots", label: "Dark Spots" },
  { value: "wrinkles", label: "Wrinkles" },
  { value: "pores", label: "Large Pores" },
  { value: "redness", label: "Redness" },
];

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export default SkincareInsight;
