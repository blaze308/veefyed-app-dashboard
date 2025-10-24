# Invite Token System Setup Guide

This guide will help you set up the complete invite token system for your admin panel.

## Overview

The invite system allows existing admins to create secure invitation tokens for new team members. The system includes:

- **Token Generation**: Admins can create invite links with specific roles and departments
- **Email Integration**: Automatic or manual email sending for invitations
- **Token Validation**: Secure token validation during signup
- **Role-based Access**: Different permissions for admins vs super admins
- **Firestore Integration**: All data stored securely in Firestore

## Setup Steps

### 1. Install Dependencies (Optional)

For automatic email sending, install EmailJS:

```bash
npm install emailjs-com
```

### 2. Environment Variables

Create a `.env` file in your project root and add EmailJS configuration (optional):

```env
# EmailJS Configuration (optional - for automatic email sending)
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
```

### 3. Firestore Security Rules

Copy the rules from `firestore-security-rules.js` to your Firebase Console:

1. Go to Firebase Console > Firestore Database > Rules
2. Replace the existing rules with the provided rules
3. Click "Publish"

### 4. Create Your First Super Admin

**No setup required!** Simply go to `/signup` and create your account. The first person to register automatically becomes the Super Administrator.

1. Navigate to `/signup`
2. Fill out the registration form
3. Submit to become the Super Admin automatically
4. Log in and start inviting team members at `/invites`

### 5. EmailJS Setup (Optional)

If you want automatic email sending:

1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create a service (Gmail, Outlook, etc.)
3. Create an email template with these variables:

   - `{{to_email}}` - Recipient email
   - `{{to_name}}` - Recipient name
   - `{{invite_url}}` - Invitation link
   - `{{invited_by_name}}` - Name of person sending invite
   - `{{invited_by_email}}` - Email of person sending invite
   - `{{role}}` - Role being assigned
   - `{{department}}` - Department
   - `{{expires_at}}` - Expiration date
   - `{{company_name}}` - Your company name

4. Add your credentials to the `.env` file

### 6. Email Template Example

Here's a sample EmailJS template:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>You're invited to join {{company_name}}</h1>

  <p>Hi {{to_name}},</p>

  <p>
    {{invited_by_name}} ({{invited_by_email}}) has invited you to join the admin
    panel as a {{role}} in the {{department}} department.
  </p>

  <p>
    <a
      href="{{invite_url}}"
      style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;"
      >Accept Invitation</a
    >
  </p>

  <p>This invitation expires on {{expires_at}}.</p>

  <p>If you can't click the button, copy this link: {{invite_url}}</p>

  <p>Best regards,<br />The {{company_name}} Team</p>
</div>
```

## Usage

### Creating Invites

1. Log in as an admin or super admin
2. Navigate to `/invites`
3. Fill out the invite form:

   - Email address of the new admin
   - Full name
   - Role (admin, support, or super_admin if you're a super admin)
   - Department
   - Expiration period

4. Click "Create Invite"
5. The system will:
   - Generate a secure token
   - Send an email (if configured) or open your email client
   - Show the invite link for manual sharing

### Accepting Invites

1. Recipients click the invite link: `https://yourapp.com/signup?invite=TOKEN`
2. The signup page validates the token and shows invite details
3. Recipients fill out their information (email is pre-filled)
4. Upon successful signup:
   - The token is marked as used
   - User gets their assigned role and department
   - Welcome email is sent (if configured)

### Managing Invites

Admins can:

- View all their created invites
- See invite status (active, used, expired)
- Copy invite links
- Deactivate unused invites
- View statistics

Super admins can:

- View all invites in the system
- Deactivate any invite
- Create super admin invites

## Security Features

- **Secure Tokens**: 32-character random tokens
- **Expiration**: Configurable expiration (1-30 days)
- **Single Use**: Tokens are automatically deactivated after use
- **Role Validation**: Firestore rules enforce role-based permissions
- **Email Verification**: Tokens are tied to specific email addresses

## Database Schema

### Admins Collection (`admins`)

```javascript
{
  uid: "firebase_auth_uid",
  email: "admin@example.com",
  fullName: "Admin Name",
  role: "admin", // "admin", "support", "super_admin"
  department: "Department Name",
  isActive: true,
  isPreApproved: true,
  emailVerified: true,
  registrationMethod: "email", // "email" or "google"
  createdAt: "2024-01-01T00:00:00.000Z",
  lastLoginAt: "2024-01-01T00:00:00.000Z"
}
```

### Invite Tokens Collection (`invite_tokens`)

```javascript
{
  token: "32_character_random_token",
  email: "newadmin@example.com",
  role: "admin",
  department: "Department Name",
  invitedBy: "inviter_uid",
  invitedByEmail: "inviter@example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
  expiresAt: "2024-01-08T00:00:00.000Z",
  usedAt: null, // Set when invite is used
  usedBy: null, // UID of user who used invite
  isActive: true,
  maxUses: 1,
  currentUses: 0
}
```

## Troubleshooting

### Email Not Sending

- Check your EmailJS configuration in `.env`
- Verify your EmailJS service is active
- Check browser console for errors
- Fallback: The system will open your default email client

### Token Validation Errors

- Ensure Firestore security rules are properly set
- Check that the token hasn't expired
- Verify the invite is still active

### Permission Errors

- Make sure users have the correct roles in Firestore
- Check that `isActive` is set to `true`
- Verify Firestore security rules are published

### Role Issues

- Super admin role is `super_admin` (underscore, not hyphen)
- Regular admin role is `admin`
- Support role is `support`

## API Reference

### InviteService Methods

- `createInvite(data)` - Create new invite token
- `validateToken(token)` - Validate token and get invite data
- `useInviteToken(token, uid)` - Mark token as used
- `getInvitesByUser(uid)` - Get invites created by user
- `deactivateInvite(id)` - Deactivate an invite
- `getInviteStats(uid)` - Get invite statistics

### EmailService Methods

- `sendInviteEmail(data)` - Send invitation email
- `sendWelcomeEmail(data)` - Send welcome email after signup
- `isConfigured()` - Check if email service is configured

## Customization

### Adding Custom Roles

1. Update the role options in `InviteManagement.jsx`
2. Add role validation in `RoleGuard.jsx`
3. Update Firestore security rules to include new roles

### Custom Email Templates

1. Create additional templates in EmailJS
2. Update `emailService.js` to use different template IDs
3. Add template selection in the invite form

### Extended Invite Data

1. Update `InviteToken.js` model
2. Modify `inviteService.js` methods
3. Update the invite form and display components

## Support

For issues or questions:

1. Check the browser console for errors
2. Verify Firestore security rules
3. Test with a super admin account
4. Check email service configuration
