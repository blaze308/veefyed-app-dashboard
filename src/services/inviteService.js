import {
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { InviteToken } from "../models/InviteToken";

class InviteService {
  constructor() {
    this.collectionName = "invite_tokens";
  }

  /**
   * Create a new invite token
   */
  async createInvite({
    email,
    role = "admin",
    department = "Administration",
    invitedBy,
    invitedByEmail,
    expiresInDays = 7,
  }) {
    try {
      // Check if there's already an active invite for this email
      const existingInvite = await this.getActiveInviteByEmail(email);
      if (existingInvite) {
        throw new Error(
          "An active invite already exists for this email address."
        );
      }

      // Create the invite token
      const invite = InviteToken.createInvite({
        email,
        role,
        department,
        invitedBy,
        invitedByEmail,
        expiresInDays,
      });

      // Save to Firestore
      const docRef = await addDoc(
        collection(db, this.collectionName),
        invite.toJSON()
      );
      invite.id = docRef.id;

      return invite;
    } catch (error) {
      console.error("Error creating invite:", error);
      throw error;
    }
  }

  /**
   * Get invite by token
   */
  async getInviteByToken(token) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("token", "==", token),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return InviteToken.fromFirestore(doc);
      }

      return null;
    } catch (error) {
      console.error("Error getting invite by token:", error);
      throw error;
    }
  }

  /**
   * Get active invite by email
   */
  async getActiveInviteByEmail(email) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("email", "==", email.trim().toLowerCase()),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const invite = InviteToken.fromFirestore(doc);

        // Check if invite is still valid
        if (invite.isValid()) {
          return invite;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting active invite by email:", error);
      throw error;
    }
  }

  /**
   * Validate invite token
   */
  async validateToken(token) {
    try {
      const invite = await this.getInviteByToken(token);

      if (!invite) {
        return { valid: false, error: "Invalid invite token." };
      }

      if (!invite.isValid()) {
        if (invite.isExpired()) {
          return { valid: false, error: "This invite has expired." };
        } else if (invite.currentUses >= invite.maxUses) {
          return { valid: false, error: "This invite has already been used." };
        } else {
          return { valid: false, error: "This invite is no longer active." };
        }
      }

      return { valid: true, invite };
    } catch (error) {
      console.error("Error validating token:", error);
      return { valid: false, error: "Failed to validate invite token." };
    }
  }

  /**
   * Use invite token (mark as used)
   */
  async useInviteToken(token, usedByUid) {
    try {
      const validation = await this.validateToken(token);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const invite = validation.invite;
      invite.markAsUsed(usedByUid);

      // Update in Firestore
      const docRef = doc(db, this.collectionName, invite.id);
      await updateDoc(docRef, {
        usedAt: invite.usedAt,
        usedBy: invite.usedBy,
        currentUses: invite.currentUses,
        isActive: invite.isActive,
      });

      return invite;
    } catch (error) {
      console.error("Error using invite token:", error);
      throw error;
    }
  }

  /**
   * Get all invites created by a user
   */
  async getInvitesByUser(uid, includeUsed = true) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where("invitedBy", "==", uid),
        orderBy("createdAt", "desc")
      );

      if (!includeUsed) {
        q = query(
          collection(db, this.collectionName),
          where("invitedBy", "==", uid),
          where("isActive", "==", true),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => InviteToken.fromFirestore(doc));
    } catch (error) {
      console.error("Error getting invites by user:", error);
      throw error;
    }
  }

  /**
   * Deactivate invite
   */
  async deactivateInvite(inviteId) {
    try {
      const docRef = doc(db, this.collectionName, inviteId);
      await updateDoc(docRef, {
        isActive: false,
      });
    } catch (error) {
      console.error("Error deactivating invite:", error);
      throw error;
    }
  }

  /**
   * Get invite statistics for admin
   */
  async getInviteStats(uid) {
    try {
      const invites = await this.getInvitesByUser(uid, true);

      const stats = {
        total: invites.length,
        active: invites.filter((i) => i.isActive && i.isValid()).length,
        used: invites.filter((i) => i.usedAt !== null).length,
        expired: invites.filter((i) => i.isExpired()).length,
      };

      return stats;
    } catch (error) {
      console.error("Error getting invite stats:", error);
      throw error;
    }
  }

  /**
   * Clean up expired invites (optional maintenance function)
   */
  async cleanupExpiredInvites() {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);
      const batch = [];

      querySnapshot.docs.forEach((doc) => {
        const invite = InviteToken.fromFirestore(doc);
        if (invite.isExpired()) {
          batch.push(updateDoc(doc.ref, { isActive: false }));
        }
      });

      await Promise.all(batch);
      return batch.length;
    } catch (error) {
      console.error("Error cleaning up expired invites:", error);
      throw error;
    }
  }
}

// Create singleton instance
const inviteService = new InviteService();
export default inviteService;
