/**
 * Invite Token Model
 * Manages invite tokens for admin registration
 */
export class InviteToken {
  constructor({
    id = null,
    token,
    email,
    role = "admin",
    department = "Administration",
    invitedBy,
    invitedByEmail,
    createdAt = new Date().toISOString(),
    expiresAt,
    usedAt = null,
    usedBy = null,
    isActive = true,
    maxUses = 1,
    currentUses = 0,
  }) {
    this.id = id;
    this.token = token;
    this.email = email;
    this.role = role;
    this.department = department;
    this.invitedBy = invitedBy; // UID of admin who created invite
    this.invitedByEmail = invitedByEmail;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.usedAt = usedAt;
    this.usedBy = usedBy; // UID of user who used invite
    this.isActive = isActive;
    this.maxUses = maxUses;
    this.currentUses = currentUses;
  }

  /**
   * Generate a secure invite token
   */
  static generateToken() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Create a new invite token
   */
  static createInvite({
    email,
    role = "admin",
    department = "Administration",
    invitedBy,
    invitedByEmail,
    expiresInDays = 7,
  }) {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return new InviteToken({
      token,
      email: email.trim().toLowerCase(),
      role,
      department,
      invitedBy,
      invitedByEmail,
      expiresAt: expiresAt.toISOString(),
    });
  }

  /**
   * Check if invite is valid for use
   */
  isValid() {
    if (!this.isActive) return false;
    if (this.currentUses >= this.maxUses) return false;
    if (new Date(this.expiresAt) < new Date()) return false;
    return true;
  }

  /**
   * Check if invite is expired
   */
  isExpired() {
    return new Date(this.expiresAt) < new Date();
  }

  /**
   * Mark invite as used
   */
  markAsUsed(usedByUid) {
    this.usedAt = new Date().toISOString();
    this.usedBy = usedByUid;
    this.currentUses += 1;

    if (this.currentUses >= this.maxUses) {
      this.isActive = false;
    }
  }

  /**
   * Convert to JSON for Firestore
   */
  toJSON() {
    return {
      token: this.token,
      email: this.email,
      role: this.role,
      department: this.department,
      invitedBy: this.invitedBy,
      invitedByEmail: this.invitedByEmail,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      usedAt: this.usedAt,
      usedBy: this.usedBy,
      isActive: this.isActive,
      maxUses: this.maxUses,
      currentUses: this.currentUses,
    };
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new InviteToken({
      id: doc.id,
      ...data,
    });
  }

  /**
   * Generate invite URL
   */
  getInviteUrl(baseUrl = window.location.origin) {
    return `${baseUrl}/signup?invite=${this.token}`;
  }
}
