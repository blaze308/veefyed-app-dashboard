import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Scheduling Service for Skincare Insights
 *
 * Note: This is a client-side implementation for demonstration.
 * In production, you should use:
 * 1. Firebase Functions with Cloud Scheduler
 * 2. Cloud Tasks
 * 3. A dedicated backend service
 *
 * Current implementation checks for scheduled content when the admin panel loads
 * and when users navigate to the insights page.
 */

class SchedulingService {
  /**
   * Check for scheduled insights that should be published
   */
  static async checkScheduledInsights() {
    try {
      const now = new Date();

      // Query for insights that are scheduled and past their scheduled publish date
      const q = query(
        collection(db, "skincare_insights"),
        where("status", "==", "scheduled"),
        where("scheduledPublishDate", "<=", now)
      );

      const querySnapshot = await getDocs(q);
      const publishPromises = [];

      querySnapshot.forEach((docSnapshot) => {
        const insight = docSnapshot.data();
        console.log(`Publishing scheduled insight: ${insight.title}`);

        // Update the insight to published status
        const updatePromise = updateDoc(
          doc(db, "skincare_insights", docSnapshot.id),
          {
            status: "published",
            publishDate: now,
            updatedAt: now,
          }
        );

        publishPromises.push(updatePromise);
      });

      if (publishPromises.length > 0) {
        await Promise.all(publishPromises);
        console.log(`Published ${publishPromises.length} scheduled insights`);
        return publishPromises.length;
      }

      return 0;
    } catch (error) {
      console.error("Error checking scheduled insights:", error);
      return 0;
    }
  }

  /**
   * Get all scheduled insights
   */
  static async getScheduledInsights() {
    try {
      const q = query(
        collection(db, "skincare_insights"),
        where("status", "==", "scheduled")
      );

      const querySnapshot = await getDocs(q);
      const scheduledInsights = [];

      querySnapshot.forEach((doc) => {
        scheduledInsights.push({
          id: doc.id,
          ...doc.data(),
          scheduledPublishDate: doc.data().scheduledPublishDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      return scheduledInsights;
    } catch (error) {
      console.error("Error getting scheduled insights:", error);
      return [];
    }
  }

  /**
   * Cancel a scheduled insight (set back to draft)
   */
  static async cancelScheduledInsight(insightId) {
    try {
      await updateDoc(doc(db, "skincare_insights", insightId), {
        status: "draft",
        scheduledPublishDate: null,
        updatedAt: new Date(),
      });

      console.log(`Cancelled scheduled insight: ${insightId}`);
      return true;
    } catch (error) {
      console.error("Error cancelling scheduled insight:", error);
      return false;
    }
  }

  /**
   * Validate scheduling date
   */
  static validateScheduleDate(scheduleDate) {
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    if (scheduleDate <= minScheduleTime) {
      return {
        valid: false,
        error:
          "Scheduled publish date must be at least 5 minutes in the future",
      };
    }

    const maxScheduleTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    if (scheduleDate > maxScheduleTime) {
      return {
        valid: false,
        error:
          "Scheduled publish date cannot be more than 1 year in the future",
      };
    }

    return { valid: true };
  }

  /**
   * Format schedule date for display
   */
  static formatScheduleDate(date) {
    if (!date) return "Not scheduled";

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }

  /**
   * Get time until scheduled publish
   */
  static getTimeUntilPublish(scheduleDate) {
    if (!scheduleDate) return null;

    const now = new Date();
    const diff = scheduleDate.getTime() - now.getTime();

    if (diff <= 0) return "Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}, ${hours} hour${
        hours > 1 ? "s" : ""
      }`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}, ${minutes} minute${
        minutes > 1 ? "s" : ""
      }`;
    } else {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
  }

  /**
   * Start periodic checking (for demo purposes)
   * In production, this should be handled by a backend service
   */
  static startPeriodicCheck(intervalMinutes = 5) {
    // Check immediately
    this.checkScheduledInsights();

    // Set up periodic checking
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(() => {
      this.checkScheduledInsights();
    }, intervalMs);

    console.log(
      `Started periodic scheduling check every ${intervalMinutes} minutes`
    );
    return intervalId;
  }

  /**
   * Stop periodic checking
   */
  static stopPeriodicCheck(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      console.log("Stopped periodic scheduling check");
    }
  }
}

export default SchedulingService;
