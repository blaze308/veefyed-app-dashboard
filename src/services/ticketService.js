import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { SupportTicket, ISSUE_TYPE_PRIORITY } from "../models/SupportTicket";

/**
 * Service for managing support tickets
 */
class TicketService {
  constructor() {
    this.collectionName = "support_tickets";
  }

  /**
   * Get all tickets
   */
  async getAllTickets() {
    try {
      const ticketsRef = collection(db, this.collectionName);
      const q = query(ticketsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => SupportTicket.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  }

  /**
   * Get tickets by status
   */
  async getTicketsByStatus(status) {
    try {
      const ticketsRef = collection(db, this.collectionName);
      const q = query(
        ticketsRef,
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => SupportTicket.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching tickets by status:", error);
      throw error;
    }
  }

  /**
   * Get tickets assigned to a specific user
   */
  async getTicketsAssignedTo(userId) {
    try {
      const ticketsRef = collection(db, this.collectionName);
      const q = query(
        ticketsRef,
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => SupportTicket.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching assigned tickets:", error);
      throw error;
    }
  }

  /**
   * Get escalated tickets
   */
  async getEscalatedTickets() {
    try {
      const ticketsRef = collection(db, this.collectionName);
      const q = query(
        ticketsRef,
        where("status", "==", "escalated"),
        orderBy("escalatedAt", "desc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => SupportTicket.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching escalated tickets:", error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId) {
    try {
      const ticketRef = doc(db, this.collectionName, ticketId);
      const ticketDoc = await getDoc(ticketRef);

      if (!ticketDoc.exists()) {
        throw new Error("Ticket not found");
      }

      return SupportTicket.fromFirestore(ticketDoc);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  }

  /**
   * Assign ticket to support staff
   */
  async assignTicket(ticketId, userId, userName) {
    try {
      const ticketRef = doc(db, this.collectionName, ticketId);
      
      await updateDoc(ticketRef, {
        assignedTo: userId,
        assignedToName: userName,
        assignedAt: serverTimestamp(),
        status: "assigned",
        updatedAt: serverTimestamp(),
      });

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      throw error;
    }
  }

  /**
   * Unassign ticket (return to pending)
   */
  async unassignTicket(ticketId) {
    try {
      const ticketRef = doc(db, this.collectionName, ticketId);
      
      await updateDoc(ticketRef, {
        assignedTo: null,
        assignedToName: null,
        assignedAt: null,
        status: "pending",
        updatedAt: serverTimestamp(),
      });

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error unassigning ticket:", error);
      throw error;
    }
  }

  /**
   * Escalate ticket to developer
   */
  async escalateTicket(ticketId, developerId, developerName, reason) {
    try {
      const ticketRef = doc(db, this.collectionName, ticketId);
      
      await updateDoc(ticketRef, {
        escalatedTo: developerId,
        escalatedToName: developerName,
        escalatedAt: serverTimestamp(),
        escalationReason: reason,
        status: "escalated",
        updatedAt: serverTimestamp(),
      });

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error escalating ticket:", error);
      throw error;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId, newStatus) {
    try {
      const ticketRef = doc(db, this.collectionName, ticketId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      // Add timestamp for specific statuses
      if (newStatus === "resolved") {
        updateData.resolvedAt = serverTimestamp();
      } else if (newStatus === "closed") {
        updateData.closedAt = serverTimestamp();
      }

      await updateDoc(ticketRef, updateData);

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      throw error;
    }
  }

  /**
   * Update ticket priority
   */
  async updateTicketPriority(ticketId, priority) {
    try {
      const ticketRef = doc(db, this.collectionName, ticketId);
      
      await updateDoc(ticketRef, {
        priority: priority,
        updatedAt: serverTimestamp(),
      });

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      throw error;
    }
  }

  /**
   * Add internal note to ticket
   */
  async addInternalNote(ticketId, authorId, authorName, note) {
    try {
      const ticket = await this.getTicketById(ticketId);
      
      const newNote = {
        author: authorId,
        authorName: authorName,
        note: note,
        timestamp: Timestamp.now(),
      };

      const updatedNotes = [...ticket.internalNotes, newNote];

      const ticketRef = doc(db, this.collectionName, ticketId);
      await updateDoc(ticketRef, {
        internalNotes: updatedNotes,
        updatedAt: serverTimestamp(),
      });

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error adding internal note:", error);
      throw error;
    }
  }

  /**
   * Record response to ticket
   */
  async recordResponse(ticketId) {
    try {
      const ticket = await this.getTicketById(ticketId);
      
      const updateData = {
        lastResponseAt: serverTimestamp(),
        responseCount: (ticket.responseCount || 0) + 1,
        updatedAt: serverTimestamp(),
      };

      // Set first response time if not set
      if (!ticket.firstResponseAt) {
        updateData.firstResponseAt = serverTimestamp();
      }

      const ticketRef = doc(db, this.collectionName, ticketId);
      await updateDoc(ticketRef, updateData);

      return await this.getTicketById(ticketId);
    } catch (error) {
      console.error("Error recording response:", error);
      throw error;
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats() {
    try {
      const tickets = await this.getAllTickets();
      
      const stats = {
        total: tickets.length,
        pending: tickets.filter(t => t.status === "pending").length,
        assigned: tickets.filter(t => t.status === "assigned").length,
        inProgress: tickets.filter(t => t.status === "in_progress").length,
        escalated: tickets.filter(t => t.status === "escalated").length,
        resolved: tickets.filter(t => t.status === "resolved").length,
        closed: tickets.filter(t => t.status === "closed").length,
        overdue: tickets.filter(t => t.isOverdue).length,
        avgResponseTime: this._calculateAvgResponseTime(tickets),
        avgResolutionTime: this._calculateAvgResolutionTime(tickets),
      };

      return stats;
    } catch (error) {
      console.error("Error getting ticket stats:", error);
      throw error;
    }
  }

  /**
   * Calculate average response time
   */
  _calculateAvgResponseTime(tickets) {
    const ticketsWithResponse = tickets.filter(t => t.responseTimeHours !== null);
    if (ticketsWithResponse.length === 0) return 0;
    
    const total = ticketsWithResponse.reduce((sum, t) => sum + t.responseTimeHours, 0);
    return (total / ticketsWithResponse.length).toFixed(2);
  }

  /**
   * Calculate average resolution time
   */
  _calculateAvgResolutionTime(tickets) {
    const resolvedTickets = tickets.filter(t => t.resolutionTimeHours !== null);
    if (resolvedTickets.length === 0) return 0;
    
    const total = resolvedTickets.reduce((sum, t) => sum + t.resolutionTimeHours, 0);
    return (total / resolvedTickets.length).toFixed(2);
  }

  /**
   * Auto-assign priority based on issue type
   */
  getAutoPriority(issueType) {
    return ISSUE_TYPE_PRIORITY[issueType] || "normal";
  }

  /**
   * Bulk update tickets
   */
  async bulkUpdateStatus(ticketIds, newStatus) {
    try {
      const promises = ticketIds.map(id => this.updateTicketStatus(id, newStatus));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error bulk updating tickets:", error);
      throw error;
    }
  }

  /**
   * Search tickets by email or name
   */
  async searchTickets(searchTerm) {
    try {
      const tickets = await this.getAllTickets();
      const lowerSearch = searchTerm.toLowerCase();
      
      return tickets.filter(ticket => 
        ticket.email.toLowerCase().includes(lowerSearch) ||
        ticket.fullName.toLowerCase().includes(lowerSearch) ||
        ticket.description.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error("Error searching tickets:", error);
      throw error;
    }
  }
}

export default new TicketService();

