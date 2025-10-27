/**
 * Support Ticket Model
 * Handles layered support system with assignment and escalation
 */
export class SupportTicket {
  constructor({
    id = null,
    // User Information
    fullName,
    email,
    accountType,
    deviceType,
    appVersion = null,
    // Issue Details
    issueType,
    description,
    dateTime = null,
    attachments = [],
    // Status & Assignment
    status = "pending", // pending, assigned, in_progress, escalated, resolved, closed
    priority = "normal", // low, normal, high, urgent
    assignedTo = null, // UID of support staff
    assignedToName = null, // Name of assigned staff
    assignedAt = null,
    // Escalation
    escalatedTo = null, // UID of developer (e.g., Jaime)
    escalatedToName = null,
    escalatedAt = null,
    escalationReason = null,
    // Internal Communication
    internalNotes = [], // Array of {author, authorName, note, timestamp}
    // Timestamps
    createdAt = null,
    updatedAt = null,
    resolvedAt = null,
    closedAt = null,
    // Response tracking
    firstResponseAt = null,
    lastResponseAt = null,
    responseCount = 0,
  }) {
    this.id = id;
    // User Information
    this.fullName = fullName;
    this.email = email;
    this.accountType = accountType;
    this.deviceType = deviceType;
    this.appVersion = appVersion;
    // Issue Details
    this.issueType = issueType;
    this.description = description;
    this.dateTime = dateTime;
    this.attachments = attachments;
    // Status & Assignment
    this.status = status;
    this.priority = priority;
    this.assignedTo = assignedTo;
    this.assignedToName = assignedToName;
    this.assignedAt = assignedAt;
    // Escalation
    this.escalatedTo = escalatedTo;
    this.escalatedToName = escalatedToName;
    this.escalatedAt = escalatedAt;
    this.escalationReason = escalationReason;
    // Internal Communication
    this.internalNotes = internalNotes;
    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.resolvedAt = resolvedAt;
    this.closedAt = closedAt;
    // Response tracking
    this.firstResponseAt = firstResponseAt;
    this.lastResponseAt = lastResponseAt;
    this.responseCount = responseCount;
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new SupportTicket({
      id: doc.id,
      // User Information
      fullName: data.fullName,
      email: data.email,
      accountType: data.accountType,
      deviceType: data.deviceType,
      appVersion: data.appVersion,
      // Issue Details
      issueType: data.issueType,
      description: data.description,
      dateTime: data.dateTime,
      attachments: data.attachments || [],
      // Status & Assignment
      status: data.status || "pending",
      priority: data.priority || "normal",
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      assignedAt: data.assignedAt?.toDate ? data.assignedAt.toDate() : data.assignedAt,
      // Escalation
      escalatedTo: data.escalatedTo,
      escalatedToName: data.escalatedToName,
      escalatedAt: data.escalatedAt?.toDate ? data.escalatedAt.toDate() : data.escalatedAt,
      escalationReason: data.escalationReason,
      // Internal Communication
      internalNotes: (data.internalNotes || []).map(note => ({
        ...note,
        timestamp: note.timestamp?.toDate ? note.timestamp.toDate() : note.timestamp,
      })),
      // Timestamps
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : data.resolvedAt,
      closedAt: data.closedAt?.toDate ? data.closedAt.toDate() : data.closedAt,
      // Response tracking
      firstResponseAt: data.firstResponseAt?.toDate ? data.firstResponseAt.toDate() : data.firstResponseAt,
      lastResponseAt: data.lastResponseAt?.toDate ? data.lastResponseAt.toDate() : data.lastResponseAt,
      responseCount: data.responseCount || 0,
    });
  }

  /**
   * Convert to Firestore document
   */
  toFirestore() {
    return {
      // User Information
      fullName: this.fullName,
      email: this.email,
      accountType: this.accountType,
      deviceType: this.deviceType,
      appVersion: this.appVersion,
      // Issue Details
      issueType: this.issueType,
      description: this.description,
      dateTime: this.dateTime,
      attachments: this.attachments,
      // Status & Assignment
      status: this.status,
      priority: this.priority,
      assignedTo: this.assignedTo,
      assignedToName: this.assignedToName,
      assignedAt: this.assignedAt,
      // Escalation
      escalatedTo: this.escalatedTo,
      escalatedToName: this.escalatedToName,
      escalatedAt: this.escalatedAt,
      escalationReason: this.escalationReason,
      // Internal Communication
      internalNotes: this.internalNotes,
      // Timestamps
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      resolvedAt: this.resolvedAt,
      closedAt: this.closedAt,
      // Response tracking
      firstResponseAt: this.firstResponseAt,
      lastResponseAt: this.lastResponseAt,
      responseCount: this.responseCount,
    };
  }

  /**
   * Check if ticket is assigned
   */
  get isAssigned() {
    return !!this.assignedTo;
  }

  /**
   * Check if ticket is escalated
   */
  get isEscalated() {
    return !!this.escalatedTo || this.status === "escalated";
  }

  /**
   * Check if ticket is resolved
   */
  get isResolved() {
    return this.status === "resolved" || this.status === "closed";
  }

  /**
   * Check if ticket is overdue (pending for more than 24 hours)
   */
  get isOverdue() {
    if (this.isResolved) return false;
    if (!this.createdAt) return false;
    
    const now = new Date();
    const hoursSinceCreation = (now - this.createdAt) / (1000 * 60 * 60);
    return hoursSinceCreation > 24;
  }

  /**
   * Get response time in hours
   */
  get responseTimeHours() {
    if (!this.firstResponseAt || !this.createdAt) return null;
    return (this.firstResponseAt - this.createdAt) / (1000 * 60 * 60);
  }

  /**
   * Get resolution time in hours
   */
  get resolutionTimeHours() {
    if (!this.resolvedAt || !this.createdAt) return null;
    return (this.resolvedAt - this.createdAt) / (1000 * 60 * 60);
  }

  /**
   * Get current handler (assigned support or escalated developer)
   */
  get currentHandler() {
    if (this.isEscalated) {
      return {
        uid: this.escalatedTo,
        name: this.escalatedToName,
        type: "developer",
      };
    }
    if (this.isAssigned) {
      return {
        uid: this.assignedTo,
        name: this.assignedToName,
        type: "support",
      };
    }
    return null;
  }

  /**
   * Assign ticket to support staff
   */
  assignTo(uid, name) {
    this.assignedTo = uid;
    this.assignedToName = name;
    this.assignedAt = new Date();
    this.status = "assigned";
    this.updatedAt = new Date();
  }

  /**
   * Escalate ticket to developer
   */
  escalateTo(uid, name, reason) {
    this.escalatedTo = uid;
    this.escalatedToName = name;
    this.escalatedAt = new Date();
    this.escalationReason = reason;
    this.status = "escalated";
    this.updatedAt = new Date();
  }

  /**
   * Add internal note
   */
  addInternalNote(authorUid, authorName, note) {
    this.internalNotes.push({
      author: authorUid,
      authorName: authorName,
      note: note,
      timestamp: new Date(),
    });
    this.updatedAt = new Date();
  }

  /**
   * Update status
   */
  updateStatus(newStatus) {
    this.status = newStatus;
    this.updatedAt = new Date();
    
    if (newStatus === "resolved") {
      this.resolvedAt = new Date();
    } else if (newStatus === "closed") {
      this.closedAt = new Date();
    }
  }

  /**
   * Record response
   */
  recordResponse() {
    if (!this.firstResponseAt) {
      this.firstResponseAt = new Date();
    }
    this.lastResponseAt = new Date();
    this.responseCount += 1;
    this.updatedAt = new Date();
  }
}

/**
 * Ticket Status Options
 */
export const TICKET_STATUS = {
  PENDING: "pending",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  ESCALATED: "escalated",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

/**
 * Ticket Priority Options
 */
export const TICKET_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

/**
 * Issue Type to Priority Mapping
 */
export const ISSUE_TYPE_PRIORITY = {
  "Technical Issue": "high",
  "Account Problem": "high",
  "Payment Issue": "urgent",
  "Feature Request": "low",
  "Other": "normal",
};

