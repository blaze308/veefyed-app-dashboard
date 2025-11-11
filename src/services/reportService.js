import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Report } from "../models/Report";

/**
 * Service for managing reports
 */
class ReportService {
  constructor() {
    this.collectionName = "reports";
  }

  /**
   * Get all reports
   */
  async getAllReports() {
    try {
      const reportsRef = collection(db, this.collectionName);
      const q = query(reportsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => Report.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  }

  /**
   * Get reports by status
   */
  async getReportsByStatus(status) {
    try {
      const reportsRef = collection(db, this.collectionName);
      const q = query(
        reportsRef,
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => Report.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching reports by status:", error);
      throw error;
    }
  }

  /**
   * Get reports assigned to a specific user
   */
  async getReportsAssignedTo(userId) {
    try {
      const reportsRef = collection(db, this.collectionName);
      const q = query(
        reportsRef,
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => Report.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching assigned reports:", error);
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      const reportDoc = await getDoc(reportRef);

      if (!reportDoc.exists()) {
        throw new Error("Report not found");
      }

      return Report.fromFirestore(reportDoc);
    } catch (error) {
      console.error("Error fetching report:", error);
      throw error;
    }
  }

  /**
   * Assign report to admin/support staff
   */
  async assignReport(reportId, userId, userName) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      
      await updateDoc(reportRef, {
        assignedTo: userId,
        assignedToName: userName,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return await this.getReportById(reportId);
    } catch (error) {
      console.error("Error assigning report:", error);
      throw error;
    }
  }

  /**
   * Unassign report (return to unassigned)
   */
  async unassignReport(reportId) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      
      await updateDoc(reportRef, {
        assignedTo: null,
        assignedToName: null,
        assignedAt: null,
        updatedAt: serverTimestamp(),
      });

      return await this.getReportById(reportId);
    } catch (error) {
      console.error("Error unassigning report:", error);
      throw error;
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(reportId, newStatus, notes = "") {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (notes) {
        updateData.adminNotes = notes;
      }

      if (newStatus === "approved") {
        updateData.resolutionDetails = notes || "Report approved by admin";
      }

      await updateDoc(reportRef, updateData);

      return await this.getReportById(reportId);
    } catch (error) {
      console.error("Error updating report status:", error);
      throw error;
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats() {
    try {
      const reports = await this.getAllReports();
      
      const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status.value === "pending").length,
        approved: reports.filter(r => r.status.value === "approved").length,
        rejected: reports.filter(r => r.status.value === "rejected").length,
        assigned: reports.filter(r => r.isAssigned).length,
        unassigned: reports.filter(r => !r.isAssigned).length,
      };

      return stats;
    } catch (error) {
      console.error("Error getting report stats:", error);
      throw error;
    }
  }
}

export default new ReportService();

