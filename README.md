# Veefyed Admin Panel

A React-based admin panel for managing the Veefyed mobile app backend. This application provides authentication and administrative tools for admin staff and support teams.

## Features

✅ **Authentication System**

- Email/password signin and signup
- Google OAuth integration
- Role-based access control (Admin, Support, Super Admin)
- Protected routes with authentication guards
- Invite token system for secure admin registration
- Pre-approved email verification

✅ **User Models**

- AdminUser model with essential properties
- InviteToken model for invitation management
- Role-based permissions system
- Firebase Firestore integration

✅ **Invite System**

- Secure token generation for new admin invitations
- Email integration (EmailJS or manual)
- Token validation and expiration
- Role-based invite creation
- Comprehensive invite management dashboard
- Optional automatic email sending (see `docs/EMAILJS_SETUP.md`)

✅ **Modern UI/UX**

- Responsive design with Tailwind CSS
- Consistent styling with Onest font family
- Form validation with highlighted field errors
- Professional dashboard interface

✅ **Public Support Page**

- Apple App Store compliant support page
- Accessible without authentication
- Contact information and FAQs
- Privacy policy and terms of service links
- Mobile-responsive design
- See [SUPPORT_PAGE_INDEX.md](SUPPORT_PAGE_INDEX.md) for complete documentation

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Auth and Firestore enabled

### Installation

1. Navigate to the admin directory:

   ```bash
   cd admin
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## User Roles and Permissions

### Super Administrator

- Full system access including invite management
- Can create invites for any role (including super admin)
- Can manage all users and invitations
- Analytics and settings access
- User management capabilities

### Administrator

- Can create invites for admin and support roles
- Can manage users, products, reviews
- Analytics and settings access
- User management capabilities

### Support Staff

- Limited access focused on support tasks
- Can manage verification requests
- Can handle support tickets
- Can moderate reviews

## Firebase Setup

The admin app uses the same Firebase configuration as the main Flutter app. Make sure your Firebase project has:

1. **Authentication** enabled with:

   - Email/Password provider
   - Google provider

2. **Firestore Database** with collections:
   - `admins` - Admin and support staff profiles
   - `invite_tokens` - Invitation tokens for secure registration
   - Other collections as needed for app functionality

## Security Rules

Ensure your Firestore security rules properly restrict access to admin collections:

```javascript
// Example security rule for admins collection
match /admins/{adminId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.uid;
  allow read: if request.auth != null; // Allow reading for email verification
}
```

## Usage

### Creating Admin Accounts

**Step 1: First User Becomes Super Admin**

The **first person to sign up** automatically becomes the **Super Administrator** with full permissions:

1. Navigate to `/signup`
2. Fill in the registration form (no invitation needed for first user):
   - Full Name
   - Email Address
   - Password
   - Confirm Password
3. Submit to create your Super Admin account

**Step 2: Subsequent Users Need Invitations**

After the first user, all new admins must be invited:

1. Super admin or admin logs in and goes to `/invites`
2. Creates an invitation for the new team member (specify role and department)
3. New user receives invite link: `/signup?invite=TOKEN`
4. New user signs up using the invitation token
5. System automatically assigns the role specified in the invitation

⚠️ **Security**: After the first user signs up, the signup page requires valid invitation tokens.

### Signing In

1. Navigate to `/signin`
2. Use email/password or Google OAuth
3. Upon successful authentication, you'll be redirected to the dashboard

### Dashboard Features

- Overview statistics
- Quick action buttons
- User profile management
- Role-based feature access

### Public Support Page

The admin app includes a **public support page** at `/support` that is accessible without authentication. This page is designed to meet Apple App Store requirements for iOS app submissions.

**Access URLs:**
- Local: `http://localhost:5173/support`
- Production: `https://your-admin-domain.com/support`

**Features:**
- Contact information (email, website)
- Frequently asked questions
- App information
- Privacy policy and terms of service links
- Mobile-responsive design
- No authentication required

**Documentation:**
For complete setup and customization instructions, see:
- **Quick Start:** [SUPPORT_PAGE_QUICK_START.md](SUPPORT_PAGE_QUICK_START.md)
- **Full Index:** [SUPPORT_PAGE_INDEX.md](SUPPORT_PAGE_INDEX.md)

**Customization:**
Before deploying, update the following in `src/pages/Support.jsx`:
1. Email address (currently: `support@veefyed.com`)
2. Website URL (currently: `https://veefyed.com`)
3. Privacy policy URL
4. Terms of service URL

See [SUPPORT_PAGE_BEFORE_AFTER.md](SUPPORT_PAGE_BEFORE_AFTER.md) for detailed examples.

## Development

### Project Structure

```
admin/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleGuard.jsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.jsx
│   ├── models/           # Data models
│   │   └── AdminUser.js
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Signin.jsx
│   │   ├── Signup.jsx
│   │   └── Support.jsx   # Public support page (no auth required)
│   ├── services/         # API services
│   │   └── authService.js
│   └── firebase/         # Firebase configuration
│       └── firebase.js
├── package.json
├── README.md
└── SUPPORT_PAGE_*.md     # Support page documentation
```

### Adding New Features

1. Create new page components in `src/pages/`
2. Add routes in `src/App.jsx`
3. Implement services in `src/services/`
4. Use the `useAuth` hook for authentication state

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment.

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript-style prop validation where applicable
3. Maintain consistent styling with the Onest font and color scheme
4. Test authentication flows thoroughly

## License

This project is part of the Veefyed ecosystem.
