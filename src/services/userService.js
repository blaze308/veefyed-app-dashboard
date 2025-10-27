import { db } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

class UserService {
  constructor() {
    this.usersCollection = "users"; // Collection name for regular users
  }

  /**
   * Fetch a single user by their UID
   * @param {string} userId - The user's UID
   * @returns {Promise<Object|null>} User data or null if not found
   */
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: userDoc.id,
          ...userData,
          // Handle date fields
          createdAt: userData.createdAt?.toDate
            ? userData.createdAt.toDate()
            : userData.createdAt
            ? new Date(userData.createdAt)
            : null,
          lastLoginAt: userData.lastLoginAt?.toDate
            ? userData.lastLoginAt.toDate()
            : userData.lastLoginAt
            ? new Date(userData.lastLoginAt)
            : null,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  }

  /**
   * Fetch multiple users by their UIDs
   * @param {string[]} userIds - Array of user UIDs
   * @returns {Promise<Object>} Object with userId as key and user data as value
   */
  async getUsersByIds(userIds) {
    try {
      const uniqueUserIds = [...new Set(userIds)]; // Remove duplicates
      const users = {};

      // Fetch users in batches to avoid too many simultaneous requests
      const batchSize = 10;
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        const batchPromises = batch.map((userId) => this.getUserById(userId));
        const batchResults = await Promise.all(batchPromises);

        batch.forEach((userId, index) => {
          users[userId] = batchResults[index];
        });
      }

      return users;
    } catch (error) {
      console.error("Error fetching users by IDs:", error);
      return {};
    }
  }

  getCountryandCity(userId, userDetails) {
    const userData = userDetails[userId];
    if (!userData) return null;

    const city = userData.city;
    const country = userData.country;

    // If both are available, return city, country
    if (city && country) {
      return `${city}, ${country}`;
    }
    // If only country is available
    else if (country) {
      return country;
    }
    // If only city is available
    else if (city) {
      return city;
    }
    // If neither is available
    else {
      return "Unknown";
    }
  }

  async getLastLogin(userId) {
    const userDoc = await getDoc(doc(db, this.usersCollection, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastLogin = userData.lastLoginAt || userData.lastLogin;

      // Handle different date formats
      if (lastLogin?.toDate) {
        return lastLogin.toDate(); // Firestore Timestamp
      } else if (lastLogin) {
        return new Date(lastLogin); // ISO string or other date format
      }
    }
    return null;
  }

  /**
   * Get user's preferred display name following UserModel logic
   * @param {Object} userData - User data object
   * @returns {string} Preferred display name
   */
  getPreferredName(userData) {
    if (!userData) return "Anonymous";

    return (
      userData.displayName ||
      userData.fullName ||
      userData.email?.split("@")[0] ||
      "Anonymous"
    );
  }

  /**
   * Get user's initials following UserModel logic
   * @param {Object} userData - User data object
   * @returns {string} User initials (max 2 characters)
   */
  getInitials(userData) {
    if (!userData) return "?";

    const name = this.getPreferredName(userData);
    if (name.length <= 1) return name.toUpperCase();

    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Check if user has complete profile
   * @param {Object} userData - User data object
   * @returns {boolean} Whether user has complete profile
   */
  hasCompleteProfile(userData) {
    if (!userData) return false;

    return !!(
      userData.fullName &&
      userData.ageGroup &&
      userData.gender &&
      userData.country &&
      userData.city
    );
  }

  /**
   * Get user's role display name
   * @param {Object} userData - User data object
   * @returns {string} Role display name
   */
  getRoleDisplayName(userData) {
    if (!userData || !userData.role) return "User";

    switch (userData.role) {
      case "user":
        return "User";
      case "admin":
        return "Admin";
      case "super_admin":
        return "Super Admin";
      case "support":
        return "Support";
      default:
        return "User";
    }
  }

  /**
   * Check if user has admin privileges
   * @param {Object} userData - User data object
   * @returns {boolean} Whether user has admin privileges
   */
  hasAdminPrivileges(userData) {
    if (!userData || !userData.role) return false;
    return ["admin", "super_admin", "support"].includes(userData.role);
  }

  /**
   * Check if user has specific permission
   * @param {Object} userData - User data object
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether user has the permission
   */
  hasPermission(userData, permission) {
    if (!userData) return false;

    // Super admin has all permissions
    if (userData.role === "super_admin") return true;

    // Check if permission is in user's permissions array
    return userData.permissions && userData.permissions.includes(permission);
  }

  /**
   * Get all support staff (users with support role)
   * @returns {Promise<Array>} Array of support staff users
   */
  async getSupportStaff() {
    try {
      const usersRef = collection(db, this.usersCollection);
      const q = query(usersRef, where("role", "==", "support"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching support staff:", error);
      return [];
    }
  }

  /**
   * Get all developers (users with admin or super_admin role)
   * @returns {Promise<Array>} Array of developer users
   */
  async getDevelopers() {
    try {
      const usersRef = collection(db, this.usersCollection);
      // Get both admin and super_admin users
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      const superAdminQuery = query(usersRef, where("role", "==", "super_admin"));
      
      const [adminSnapshot, superAdminSnapshot] = await Promise.all([
        getDocs(adminQuery),
        getDocs(superAdminQuery),
      ]);

      const admins = adminSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));

      const superAdmins = superAdminSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));

      return [...admins, ...superAdmins];
    } catch (error) {
      console.error("Error fetching developers:", error);
      return [];
    }
  }

  /**
   * Get all admin users (support, admin, super_admin)
   * @returns {Promise<Array>} Array of all admin users
   */
  async getAllAdminUsers() {
    try {
      const [supportStaff, developers] = await Promise.all([
        this.getSupportStaff(),
        this.getDevelopers(),
      ]);

      return [...supportStaff, ...developers];
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
