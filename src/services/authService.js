import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { AdminUser } from "../models/AdminUser";

class AuthService {
  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.currentUser = null;
    this.authStateListeners = [];
    this._isSignupInProgress = false; // Flag to prevent aggressive auth checking during signup
  }

  /**
   * Initialize auth service and listen to auth state changes
   */
  initialize() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            console.log(
              `Auth state changed - Firebase user: ${firebaseUser.email} (${firebaseUser.uid})`
            );

            // Skip admin profile validation if we're in the middle of signup process
            if (this._isSignupInProgress) {
              console.log(
                "🔄 Signup in progress - skipping admin profile validation"
              );
              this.currentUser = null; // Don't set current user during signup
              this.authStateListeners.forEach((listener) => listener(null));
              resolve(null);
              return;
            }

            // Get admin profile from Firestore
            const adminProfile = await this.getAdminProfile(firebaseUser.uid);

            console.log(`Admin profile found: ${!!adminProfile}`);
            if (adminProfile) {
              console.log(`Admin profile active: ${adminProfile.isActive}`);
              console.log(`Admin role: ${adminProfile.role}`);
            }

            if (adminProfile && adminProfile.isActive) {
              // Only set user if they have a valid admin profile
              this.currentUser = adminProfile;
              console.log("✅ User authenticated successfully");
            } else {
              // No admin profile or inactive - sign out Firebase user
              console.log(
                "❌ No valid admin profile found, signing out Firebase user"
              );
              await signOut(auth);
              this.currentUser = null;
            }
          } catch (error) {
            console.error("Error loading admin profile:", error);
            // On error, sign out to be safe
            await signOut(auth);
            this.currentUser = null;
          }
        } else {
          console.log("No Firebase user - user signed out");
          this.currentUser = null;
        }

        // Notify all listeners
        this.authStateListeners.forEach((listener) =>
          listener(this.currentUser)
        );
        resolve(this.currentUser);
      });
    });
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const firebaseUser = userCredential.user;

      // Get admin profile
      const adminProfile = await this.getAdminProfile(firebaseUser.uid);
      if (!adminProfile) {
        // Sign out if no admin profile found
        await signOut(auth);
        throw new Error(
          "Admin profile not found. Please contact administrator."
        );
      }

      if (!adminProfile.isActive) {
        // Sign out if account is inactive
        await signOut(auth);
        throw new Error("Account is inactive. Please contact administrator.");
      }

      return adminProfile;
    } catch (error) {
      console.error("Sign in error:", error);
      // Ensure user is signed out on any profile validation error
      if (
        error.message.includes("Admin profile not found") ||
        error.message.includes("Account is inactive")
      ) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error(
            "Error signing out after failed sign in:",
            signOutError
          );
        }
      }
      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign in with Google (for existing users)
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = result.user;

      // Get existing admin profile
      let adminProfile = await this.getAdminProfile(firebaseUser.uid);

      if (!adminProfile) {
        // Check if this is the first user (should be super admin)
        const isFirstUser = await this.isFirstUser();

        console.log(`Google sign-in debug for ${firebaseUser.email}:`);
        console.log(`- Is first user: ${isFirstUser}`);
        console.log(`- Firebase UID: ${firebaseUser.uid}`);

        if (isFirstUser) {
          console.log("Creating first super admin profile...");
          // Create first super admin
          adminProfile = AdminUser.createProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName,
            role: "super_admin",
            department: "Administration",
            emailVerified: firebaseUser.emailVerified,
            registrationMethod: "google",
          });

          // Save the profile
          await this.saveAdminProfile(adminProfile);
          console.log("✅ First super admin profile created successfully");
        } else {
          // Not first user and no existing profile - sign out and reject login
          console.log("❌ Not first user and no admin profile found");
          await signOut(auth);
          throw new Error(
            "No admin account found. Please contact an administrator to get invited to the admin panel."
          );
        }
      }

      if (!adminProfile.isActive) {
        // Sign out inactive users
        await signOut(auth);
        throw new Error("Account is inactive. Please contact administrator.");
      }

      return adminProfile;
    } catch (error) {
      console.error("Google sign in error:", error);
      // Ensure user is signed out on any error
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error(
          "Error signing out after failed Google sign in:",
          signOutError
        );
      }
      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign up with Google using invite token
   * Simple flow: check invite -> check email not exists -> create admin
   */
  async signUpWithGoogle(inviteToken) {
    this._isSignupInProgress = true; // Prevent aggressive auth checking

    try {
      if (!inviteToken) {
        throw new Error("Invite token is required for registration.");
      }

      console.log(`🔄 Starting Google signup with invite token`);

      // Step 1: Validate invite token
      const inviteService = (await import("./inviteService")).default;
      const validation = await inviteService.validateToken(inviteToken);

      if (!validation.valid) {
        throw new Error(validation.error || "Invalid invite token.");
      }
      console.log(`✅ Valid invite found - Email: ${validation.invite.email}`);

      // Step 2: Sign in with Google
      const result = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = result.user;
      console.log(`✅ Google authentication successful: ${firebaseUser.email}`);

      // Step 3: Check if invite email matches Google account email
      if (
        validation.invite.email.toLowerCase() !==
        firebaseUser.email.toLowerCase()
      ) {
        await signOut(auth); // Sign out the Firebase user
        throw new Error(
          "Google account email does not match the invited email address."
        );
      }

      // Step 4: Check if admin profile already exists
      const existingAdmin = await this.getAdminProfile(firebaseUser.uid);
      if (existingAdmin) {
        console.log(
          "✅ Admin profile already exists, returning existing profile"
        );
        this._isSignupInProgress = false;
        this.currentUser = existingAdmin;
        this.authStateListeners.forEach((listener) => listener(existingAdmin));
        return existingAdmin;
      }

      const inviteData = validation.invite;

      // Step 5: Create admin profile
      const adminProfile = AdminUser.createProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: firebaseUser.displayName,
        role: inviteData.role,
        department: inviteData.department,
        emailVerified: firebaseUser.emailVerified,
        registrationMethod: "google",
        invitedBy: inviteData.invitedBy,
        inviteToken: inviteToken,
      });

      // Step 6: Save admin profile
      await this.saveAdminProfile(adminProfile);
      console.log("✅ Admin profile created successfully");

      // Step 7: Mark invite as used
      await inviteService.useInviteToken(inviteToken, firebaseUser.uid);
      console.log("✅ Invite token marked as used");

      // Step 8: Set current user and notify listeners
      this._isSignupInProgress = false;
      this.currentUser = adminProfile;
      this.authStateListeners.forEach((listener) => listener(adminProfile));

      return adminProfile;
    } catch (error) {
      console.error("❌ Google signup error:", error);
      this._isSignupInProgress = false;

      // Sign out on any error
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error(
          "Error signing out after failed Google signup:",
          signOutError
        );
      }

      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign up with email and password (admin registration)
   * Simple flow: check invite -> check email not exists -> create admin
   */
  async signUpWithEmail({
    email,
    password,
    fullName,
    inviteToken,
    role = "admin",
    department = "Administration",
  }) {
    this._isSignupInProgress = true; // Prevent aggressive auth checking
    let firebaseUser = null;

    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log(`🔄 Starting signup for: ${trimmedEmail}`);

      // Step 1: Validate invite token (if provided)
      let inviteData = null;
      if (inviteToken) {
        const inviteService = (await import("./inviteService")).default;
        const validation = await inviteService.validateToken(inviteToken);

        if (!validation.valid) {
          throw new Error(validation.error || "Invalid invite token.");
        }

        // Check if invite email matches signup email
        if (validation.invite.email !== trimmedEmail) {
          throw new Error("Email does not match the invited email address.");
        }

        // Use invite data for role and department
        inviteData = validation.invite;
        role = inviteData.role;
        department = inviteData.department;
        console.log(
          `✅ Valid invite found - Role: ${role}, Department: ${department}`
        );
      }

      // Step 2: Check if email already exists in admins collection
      const existingAdmin = await this.checkExistingUserByEmail(trimmedEmail);
      if (existingAdmin) {
        throw new Error(
          "An admin account with this email already exists. Please sign in instead."
        );
      }
      console.log("✅ Email not found in admins collection");

      // Step 3: Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      firebaseUser = userCredential.user;
      console.log(`✅ Firebase user created: ${firebaseUser.uid}`);

      // Step 4: Create admin profile
      const adminUser = AdminUser.createProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: fullName,
        role: role,
        department: department,
        emailVerified: firebaseUser.emailVerified,
        registrationMethod: "email",
        invitedBy: inviteData ? inviteData.invitedBy : null,
        inviteToken: inviteToken || null,
      });

      // Step 5: Save admin profile to Firestore
      await this.saveAdminProfile(adminUser);
      console.log("✅ Admin profile created successfully");

      // Step 6: Mark invite as used (if applicable)
      if (inviteToken) {
        const inviteService = (await import("./inviteService")).default;
        await inviteService.useInviteToken(inviteToken, firebaseUser.uid);
        console.log("✅ Invite token marked as used");
      }

      // Step 7: Set current user and notify listeners
      this._isSignupInProgress = false;
      this.currentUser = adminUser;
      this.authStateListeners.forEach((listener) => listener(adminUser));

      return adminUser;
    } catch (error) {
      console.error("❌ Signup error:", error);
      this._isSignupInProgress = false;

      // Clean up Firebase user if created but admin profile failed
      if (firebaseUser && error.code !== "auth/email-already-in-use") {
        try {
          console.log("🧹 Cleaning up Firebase user due to signup failure");
          await signOut(auth);
        } catch (cleanupError) {
          console.error("Error cleaning up Firebase user:", cleanupError);
        }
      }

      throw this._handleAuthError(error);
    }
  }

  /**
   * Get user profile from Firestore (unified users collection)
   */
  async getAdminProfile(uid) {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        // Only return users with admin privileges (admin, super_admin, support)
        if (
          userData.role &&
          ["admin", "super_admin", "support"].includes(userData.role)
        ) {
          return AdminUser.fromFirestore(docSnap);
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting admin profile:", error);
      return null;
    }
  }

  /**
   * Check if a user with admin privileges exists for a given email
   */
  async checkExistingUserByEmail(email) {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase()),
        where("role", "in", ["admin", "super_admin", "support"])
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return AdminUser.fromFirestore(doc);
      }
      return null;
    } catch (error) {
      console.error("Error checking existing user by email:", error);

      // If we get a permission error, it means we can't check the users collection
      // This is expected during signup before authentication
      if (
        error.code === "permission-denied" ||
        error.message.includes("permissions")
      ) {
        console.log(
          "Permission denied - cannot check users collection during signup. This is expected."
        );
        return null;
      }

      return null;
    }
  }

  /**
   * Save user profile to Firestore (unified users collection)
   */
  async saveAdminProfile(adminUser) {
    try {
      const docRef = doc(db, "users", adminUser.uid);
      const data = adminUser.toFirestore();
      // Remove uid from data since it's the document ID
      delete data.uid;
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error saving user profile:", error);
      throw error;
    }
  }

  /**
   * Check if this is the first admin user to register (should become super admin)
   */
  async isFirstUser() {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["admin", "super_admin", "support"])
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if first admin user:", error);
      return false;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  /**
   * Handle authentication errors
   */
  _handleAuthError(error) {
    switch (error.code) {
      case "auth/user-not-found":
        return new Error("No account found with this email address.");
      case "auth/wrong-password":
        return new Error("Incorrect password.");
      case "auth/invalid-email":
        return new Error("Invalid email address.");
      case "auth/user-disabled":
        return new Error("This account has been disabled.");
      case "auth/too-many-requests":
        return new Error("Too many failed attempts. Please try again later.");
      case "auth/email-already-in-use":
        return new Error("An account with this email already exists.");
      case "auth/weak-password":
        return new Error("Password should be at least 6 characters.");
      case "auth/popup-closed-by-user":
        return new Error("Sign-in was cancelled.");
      case "auth/network-request-failed":
        return new Error("Network error. Please check your connection.");
      default:
        return error.message
          ? new Error(error.message)
          : new Error("An unexpected error occurred.");
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
