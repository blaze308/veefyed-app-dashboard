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

/**
 * Industry-Standard Insight Model for Veefyed Skincare App
 * 
 * This model represents educational skincare content (insights/articles)
 * that helps users make informed decisions about skincare products.
 */
export class Insight {
  constructor(data = {}) {
    // Core Content Fields
    this.id = data.id || null;
    this.title = data.title || "";
    this.description = data.description || ""; // Short summary for cards/lists
    this.content = data.content || ""; // Full HTML/markdown content
    
    // Author Information
    this.author = data.author || "";
    this.authorBio = data.authorBio || "";
    this.authorImage = data.authorImage || "";
    
    // Featured Media (User selects before upload)
    this.featuredImage = data.featuredImage || ""; // Main thumbnail for cards
    this.featuredImageThumbnail = data.featuredImageThumbnail || ""; // Optimized thumbnail
    this.featuredVideo = data.featuredVideo || ""; // Main video URL if video-focused
    this.featuredVideoThumbnail = data.featuredVideoThumbnail || ""; // Video thumbnail
    
    // Media Collections (All media with thumbnails)
    this.media = data.media || []; // Array of {type, url, thumbnail, caption, alt, order}
    
    // Categorization & Discovery
    this.category = data.category || "skincare"; // Main category
    this.tags = data.tags || []; // Searchable tags
    this.skinTypes = data.skinTypes || []; // Target skin types
    this.skinConcerns = data.skinConcerns || []; // Addresses these concerns
    
    // Reading/Viewing Experience
    this.readTimeMinutes = data.readTimeMinutes || 3;
    this.difficulty = data.difficulty || "beginner"; // beginner, intermediate, advanced
    
    // SEO & Metadata
    this.metaTitle = data.metaTitle || "";
    this.metaDescription = data.metaDescription || "";
    this.keywords = data.keywords || [];
    this.slug = data.slug || ""; // URL-friendly identifier
    
    // Relationships
    this.relatedProducts = data.relatedProducts || []; // Product IDs
    this.relatedInsights = data.relatedInsights || []; // Other insight IDs
    
    // Publishing & Status
    this.status = data.status || "draft"; // draft, published, archived
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isFeatured = data.isFeatured !== undefined ? data.isFeatured : false;
    this.publishDate = data.publishDate || null;
    
    // Engagement Metrics
    this.viewCount = data.viewCount || 0;
    this.likeCount = data.likeCount || 0;
    this.shareCount = data.shareCount || 0;
    this.saveCount = data.saveCount || 0;
    
    // System Fields
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
    if (!this.featuredImage || this.featuredImage.trim().length === 0) {
      errors.push("Featured image is required");
    }

    if (this.media.length > 20) {
      errors.push("Maximum 20 media items allowed per insight");
    }

    // Ensure all media items have thumbnails
    const mediaWithoutThumbnails = this.media.filter(
      (item) => !item.thumbnail || item.thumbnail.trim().length === 0
    );
    if (mediaWithoutThumbnails.length > 0) {
      errors.push("All media items must have thumbnails");
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
      description: this.description,
      content: this.content,
      author: this.author,
      authorBio: this.authorBio,
      authorImage: this.authorImage,
      featuredImage: this.featuredImage,
      featuredImageThumbnail: this.featuredImageThumbnail,
      featuredVideo: this.featuredVideo,
      featuredVideoThumbnail: this.featuredVideoThumbnail,
      media: this.media,
      category: this.category,
      tags: this.tags,
      skinTypes: this.skinTypes,
      skinConcerns: this.skinConcerns,
      readTimeMinutes: this.readTimeMinutes,
      difficulty: this.difficulty,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      keywords: this.keywords,
      slug: this.slug,
      relatedProducts: this.relatedProducts,
      relatedInsights: this.relatedInsights,
      status: this.status,
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      publishDate: this.publishDate,
      viewCount: this.viewCount,
      likeCount: this.likeCount,
      shareCount: this.shareCount,
      saveCount: this.saveCount,
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
    return new Insight({
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

    const collectionRef = collection(db, "insights");

    if (this.id) {
      // Update existing document
      const docRef = doc(db, "insights", this.id);
      await updateDoc(docRef, this.toFirestore());
      return this.id;
    } else {
      // Create new document
      const docRef = await addDoc(collectionRef, this.toFirestore());
      this.id = docRef.id;
      return this.id;
    }
  }

  // Soft delete
  async archive() {
    if (!this.id) {
      throw new Error("Cannot archive insight without ID");
    }

    this.status = "archived";
    this.isActive = false;
    this.updatedAt = serverTimestamp();

    const docRef = doc(db, "insights", this.id);
    await updateDoc(docRef, {
      status: "archived",
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  }

  // Restore from archive
  async restore() {
    if (!this.id) {
      throw new Error("Cannot restore insight without ID");
    }

    this.status = "draft";
    this.isActive = true;
    this.updatedAt = serverTimestamp();

    const docRef = doc(db, "insights", this.id);
    await updateDoc(docRef, {
      status: "draft",
      isActive: true,
      updatedAt: serverTimestamp(),
    });
  }

  // Hard delete from Firestore (admin only)
  async delete() {
    if (!this.id) {
      throw new Error("Cannot delete insight without ID");
    }

    const docRef = doc(db, "insights", this.id);
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

    let q = query(collection(db, "insights"));

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
    return querySnapshot.docs.map((doc) => Insight.fromFirestore(doc));
  }

  static async getById(id) {
    const docRef = doc(db, "insights", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return Insight.fromFirestore(docSnap);
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
      collection(db, "insights"),
      where("category", "==", category),
      where("isActive", "==", true),
      where("status", "==", "published")
    );

    q = query(q, orderBy(orderByField, orderDirection));

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => Insight.fromFirestore(doc));
  }

  static async getFeatured(limitCount = 5) {
    const q = query(
      collection(db, "insights"),
      where("isFeatured", "==", true),
      where("isActive", "==", true),
      where("status", "==", "published"),
      orderBy("publishDate", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => Insight.fromFirestore(doc));
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
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Generate URL slug from title
  generateSlug() {
    if (!this.title) return "";
    
    return this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
  }

  // Clone method for editing
  clone() {
    return new Insight({
      ...this,
      id: null, // Remove ID for cloning
      createdAt: null,
      updatedAt: null,
    });
  }
}

// Export constants for use in components
export const CATEGORIES = [
  { value: "skincare-basics", label: "Skincare Basics" },
  { value: "ingredients", label: "Ingredient Education" },
  { value: "routines", label: "Skincare Routines" },
  { value: "product-reviews", label: "Product Reviews" },
  { value: "skin-concerns", label: "Skin Concerns" },
  { value: "tips-tricks", label: "Tips & Tricks" },
  { value: "trends", label: "Beauty Trends" },
  { value: "expert-advice", label: "Expert Advice" },
];

export const SKIN_TYPES = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
  { value: "all", label: "All Skin Types" },
];

export const SKIN_CONCERNS = [
  { value: "acne", label: "Acne & Breakouts" },
  { value: "aging", label: "Anti-Aging" },
  { value: "hyperpigmentation", label: "Hyperpigmentation" },
  { value: "dark-spots", label: "Dark Spots" },
  { value: "dryness", label: "Dryness & Dehydration" },
  { value: "sensitivity", label: "Sensitivity & Redness" },
  { value: "dullness", label: "Dullness" },
  { value: "wrinkles", label: "Fine Lines & Wrinkles" },
  { value: "pores", label: "Large Pores" },
  { value: "texture", label: "Uneven Texture" },
  { value: "sun-damage", label: "Sun Damage" },
  { value: "scarring", label: "Scarring" },
];

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const MEDIA_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

export default Insight;

