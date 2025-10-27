/**
 * User Model (Unified for both regular users and admins)
 * Profile data only - passwords handled by Firebase Auth
 * This model matches the Dart UserModel to ensure consistency
 */
export class AdminUser {
  constructor({
    uid,
    email,
    displayName = null,
    photoURL = null,
    emailVerified = false,
    createdAt = null,
    lastLoginAt = null,
    // Profile fields from signup form (mobile users)
    fullName = null,
    ageGroup = null,
    gender = null,
    country = null,
    countryCode = null,
    city = null,
    signUpForUpdates = false,
    registrationMethod = "email",
    savedProducts = [],
    // Role-based fields (admin users)
    role = "user", // Default to user role
    department = null,
    permissions = [],
    isActive = true,
    invitedBy = null, // Track who invited this user (for admin roles)
    inviteToken = null, // Reference to invite token used
  }) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.lastLoginAt = lastLoginAt;

    // Additional profile fields
    this.fullName = fullName;
    this.ageGroup = ageGroup;
    this.gender = gender;
    this.country = country;
    this.countryCode = countryCode;
    this.city = city;
    this.signUpForUpdates = signUpForUpdates;
    this.registrationMethod = registrationMethod;
    this.savedProducts = savedProducts;

    // Role-based properties
    this.role = role;
    this.department = department;
    this.permissions = permissions;
    this.isActive = isActive;
    this.invitedBy = invitedBy;
    this.inviteToken = inviteToken;
  }

  /**
   * Create AdminUser from Firebase User object
   */
  static fromFirebaseUser(firebaseUser) {
    return new AdminUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata?.creationTime,
      lastLoginAt: firebaseUser.metadata?.lastSignInTime,
      registrationMethod: AdminUser._getRegistrationMethod(firebaseUser),
      fullName: firebaseUser.displayName,
    });
  }

  /**
   * Helper method to determine registration method
   */
  static _getRegistrationMethod(firebaseUser) {
    if (firebaseUser.providerData) {
      for (const provider of firebaseUser.providerData) {
        switch (provider.providerId) {
          case "google.com":
            return "google";
          case "password":
            return "email";
        }
      }
    }
    return "email";
  }

  /**
   * Create user profile with additional data (for admin creation)
   */
  static createProfile({
    uid,
    email,
    fullName,
    role = "admin",
    department = null,
    permissions = [],
    registrationMethod = "email",
    emailVerified = false,
    invitedBy = null,
    inviteToken = null,
    // Mobile user fields (optional for admin creation)
    ageGroup = null,
    gender = null,
    country = null,
    countryCode = null,
    city = null,
    signUpForUpdates = false,
  }) {
    return new AdminUser({
      uid,
      email,
      displayName: fullName,
      fullName,
      ageGroup,
      gender,
      country,
      countryCode,
      city,
      signUpForUpdates,
      registrationMethod,
      emailVerified,
      createdAt: new Date(),
      role,
      department,
      permissions:
        permissions.length > 0 ? permissions : ROLE_PERMISSIONS[role] || [],
      isActive: true,
      invitedBy,
      inviteToken,
    });
  }

  /**
   * Convert to JSON for Firestore storage
   */
  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      // Additional profile fields
      fullName: this.fullName,
      ageGroup: this.ageGroup,
      gender: this.gender,
      country: this.country,
      countryCode: this.countryCode,
      city: this.city,
      signUpForUpdates: this.signUpForUpdates,
      registrationMethod: this.registrationMethod,
      savedProducts: this.savedProducts,
      // Role-based fields
      role: this.role,
      department: this.department,
      permissions: this.permissions,
      isActive: this.isActive,
      invitedBy: this.invitedBy,
      inviteToken: this.inviteToken,
    };
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new AdminUser({
      uid: doc.id, // Use document ID as UID
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      emailVerified: data.emailVerified || false,
      // Handle date fields - support both Firestore Timestamps and ISO strings
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt
        ? new Date(data.createdAt)
        : null,
      lastLoginAt: data.lastLoginAt?.toDate
        ? data.lastLoginAt.toDate()
        : data.lastLoginAt
        ? new Date(data.lastLoginAt)
        : null,
      // Additional profile fields
      fullName: data.fullName,
      ageGroup: data.ageGroup,
      gender: data.gender,
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      signUpForUpdates: data.signUpForUpdates || false,
      registrationMethod: data.registrationMethod || "email",
      savedProducts: data.savedProducts || [],
      // Role-based fields
      role: data.role || "user",
      department: data.department,
      permissions: data.permissions || [],
      isActive: data.isActive !== false,
      invitedBy: data.invitedBy,
      inviteToken: data.inviteToken,
    });
  }

  /**
   * Get preferred display name
   */
  get preferredName() {
    return (
      this.fullName || this.displayName || this.email?.split("@")[0] || "Admin"
    );
  }

  /**
   * Get initials for avatar
   */
  get initials() {
    const name = this.preferredName;
    if (name.length <= 1) return name.toUpperCase();

    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.role === "super_admin";
  }

  /**
   * Check if user is super admin
   */
  get isSuperAdmin() {
    return this.role === "super_admin";
  }

  /**
   * Check if user is admin
   */
  get isAdmin() {
    return this.role === "admin";
  }

  /**
   * Check if user is support staff
   */
  get isSupport() {
    return this.role === "support";
  }

  /**
   * Check if user is a regular user
   */
  get isRegularUser() {
    return this.role === "user";
  }

  /**
   * Check if user has admin privileges (admin, super admin, or support)
   */
  get hasAdminPrivileges() {
    return (
      this.role === "admin" ||
      this.role === "super_admin" ||
      this.role === "support"
    );
  }

  /**
   * Check if user has complete profile (mobile-specific fields)
   */
  get hasCompleteProfile() {
    return !!(
      this.fullName &&
      this.ageGroup &&
      this.gender &&
      this.country &&
      this.city
    );
  }

  /**
   * Check if profile is incomplete
   */
  get isProfileIncomplete() {
    return !this.hasCompleteProfile;
  }

  /**
   * Update user role and permissions
   */
  updateRole(newRole) {
    this.role = newRole;
    this.permissions = ROLE_PERMISSIONS[newRole] || [];
  }
}

/**
 * Default permission sets for different roles
 */
export const ADMIN_PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_REVIEWS: "manage_reviews",
  MANAGE_VERIFICATION_REQUESTS: "manage_verification_requests",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_SUPPORT_TICKETS: "manage_support_tickets",
  GENERATE_INVITES: "generate_invites",
  MANAGE_ADMINS: "manage_admins",
};

export const ROLE_PERMISSIONS = {
  super_admin: Object.values(ADMIN_PERMISSIONS), // Full access to everything
  admin: [
    ADMIN_PERMISSIONS.MANAGE_USERS,
    ADMIN_PERMISSIONS.MANAGE_PRODUCTS,
    ADMIN_PERMISSIONS.MANAGE_REVIEWS,
    ADMIN_PERMISSIONS.MANAGE_VERIFICATION_REQUESTS,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    ADMIN_PERMISSIONS.MANAGE_SUPPORT_TICKETS,
    ADMIN_PERMISSIONS.MANAGE_SETTINGS,
    // Note: Admins cannot GENERATE_INVITES or MANAGE_ADMINS (super admin only)
  ],
  support: [
    ADMIN_PERMISSIONS.MANAGE_VERIFICATION_REQUESTS,
    ADMIN_PERMISSIONS.MANAGE_SUPPORT_TICKETS,
    ADMIN_PERMISSIONS.MANAGE_REVIEWS,
    ADMIN_PERMISSIONS.MANAGE_PRODUCTS, // Support can now manage insights/products
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
  ],
};
