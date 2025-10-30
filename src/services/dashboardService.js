import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

class DashboardService {
  /**
   * Get total count of reviews
   */
  async getTotalReviews() {
    try {
      const reviewsRef = collection(db, "reviews");
      const snapshot = await getDocs(reviewsRef);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching total reviews:", error);
      return 0;
    }
  }

  /**
   * Get count of pending verification requests
   */
  async getPendingVerifications() {
    try {
      const verificationsRef = collection(db, "verification_requests");
      const q = query(verificationsRef, where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      return 0;
    }
  }

  /**
   * Get count of open support tickets
   */
  async getOpenTickets() {
    try {
      const ticketsRef = collection(db, "support_tickets");
      const q = query(ticketsRef, where("status", "in", ["open", "in_progress"]));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching open tickets:", error);
      return 0;
    }
  }

  /**
   * Get total count of skincare insights
   */
  async getTotalInsights() {
    try {
      const insightsRef = collection(db, "skincare_insights");
      const snapshot = await getDocs(insightsRef);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching total insights:", error);
      return 0;
    }
  }

  /**
   * Get count of published skincare insights
   */
  async getPublishedInsights() {
    try {
      const insightsRef = collection(db, "skincare_insights");
      const q = query(insightsRef, where("status", "==", "published"));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching published insights:", error);
      return 0;
    }
  }

  /**
   * Get total count of reports
   */
  async getTotalReports() {
    try {
      const reportsRef = collection(db, "reports");
      const snapshot = await getDocs(reportsRef);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching total reports:", error);
      return 0;
    }
  }

  /**
   * Get all dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [
        totalReviews,
        pendingVerifications,
        openTickets,
        totalInsights,
        publishedInsights,
        totalReports,
      ] = await Promise.all([
        this.getTotalReviews(),
        this.getPendingVerifications(),
        this.getOpenTickets(),
        this.getTotalInsights(),
        this.getPublishedInsights(),
        this.getTotalReports(),
      ]);

      return {
        totalReviews,
        pendingVerifications,
        openTickets,
        totalInsights,
        publishedInsights,
        totalReports,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalReviews: 0,
        pendingVerifications: 0,
        openTickets: 0,
        totalInsights: 0,
        publishedInsights: 0,
        totalReports: 0,
      };
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

