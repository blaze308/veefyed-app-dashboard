/**
 * Firestore Security Rules for Invite Token System
 * Copy these rules to your Firebase Console > Firestore Database > Rules
 */

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/admins/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().role in ['admin', 'super_admin'];
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && getUserData().role == 'super_admin';
    }
    
    function isActiveUser() {
      return isAuthenticated() && getUserData().isActive == true;
    }
    
    // Admins collection rules
    match /admins/{adminId} {
      // Allow reading own profile
      allow read: if isAuthenticated() && 
                  request.auth.uid == adminId;
      
      // Allow writing own profile after authentication
      allow write: if isAuthenticated() && 
                   request.auth.uid == adminId &&
                   isActiveUser();
      
      // Allow anyone to create their own admin profile (for first user signup)
      allow create: if request.auth.uid == adminId;
      
      // Allow checking if any admins exist (for first user detection) and email validation during signup
      allow read: if true;
      
      // Super admins can read all admin profiles
      allow read: if isSuperAdmin();
      
      // Super admins can create/update admin profiles
      allow create, update: if isSuperAdmin();
      
      // Super admins can deactivate (not delete) admin profiles
      allow update: if isSuperAdmin() && 
                    'isActive' in request.resource.data &&
                    request.resource.data.isActive == false;
    }
    
    // Invite tokens collection rules
    match /invite_tokens/{tokenId} {
      // Allow reading invite tokens for validation (public read for token validation)
      allow read: if true;
      
      // Allow admins and super admins to create invite tokens
      allow create: if isAdmin() && isActiveUser() &&
                    request.resource.data.invitedBy == request.auth.uid;
      
      // Allow reading own created invites
      allow read: if isAuthenticated() && 
                  resource.data.invitedBy == request.auth.uid;
      
      // Allow updating invite tokens (for marking as used)
      allow update: if isAuthenticated() && (
        // Creator can update their invites
        resource.data.invitedBy == request.auth.uid ||
        // System can mark invite as used during signup
        (request.resource.data.diff(resource.data).affectedKeys()
         .hasOnly(['usedAt', 'usedBy', 'currentUses', 'isActive']) &&
         request.resource.data.usedBy == request.auth.uid)
      );
      
      // Super admins can read all invite tokens
      allow read: if isSuperAdmin();
      
      // Super admins can deactivate any invite token
      allow update: if isSuperAdmin() && 
                    'isActive' in request.resource.data &&
                    request.resource.data.isActive == false;
    }
    
    // Allow authenticated users to access all other collections
    // (Your app's main data collections)
    match /{document=**} {
      allow read, write: if isAuthenticated();
    }
  }
}