import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import inviteService from "../services/inviteService";
import emailService from "../services/emailService";
import authService from "../services/authService";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [inviteValidating, setInviteValidating] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);

  const {
    signUp,
    signInWithGoogle,
    signUpWithGoogle,
    isAuthenticated,
    error,
    clearError,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check for invite token or first user status
  useEffect(() => {
    const initializeSignup = async () => {
      if (inviteToken) {
        // Handle invite token validation
        setInviteValidating(true);
        try {
          const validation = await inviteService.validateToken(inviteToken);
          if (validation.valid) {
            setInviteData(validation.invite);
            // Pre-fill email from invite
            setFormData((prev) => ({
              ...prev,
              email: validation.invite.email,
            }));
          } else {
            setErrors({ invite: validation.error });
          }
        } catch (err) {
          setErrors({
            invite: err.message || "Failed to validate invite token.",
          });
        } finally {
          setInviteValidating(false);
        }
      } else {
        // Check if this would be the first user (no invite needed)
        try {
          const firstUser = await authService.isFirstUser();
          setIsFirstUser(firstUser);
        } catch (error) {
          console.log("Could not check first user status:", error);
          setIsFirstUser(false);
        }
      }
    };

    initializeSignup();
  }, [inviteToken]);

  useEffect(() => {
    if (error) {
      setErrors({ general: error });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "*Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "*Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "*Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "*Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "*Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "*Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "*Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "*You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if signup is allowed
    if (inviteToken && !inviteData) {
      setErrors({
        invite: "Invalid invite token. Please use a valid invitation link.",
      });
      return;
    }

    if (!inviteToken && !isFirstUser) {
      setErrors({
        general:
          "Registration is by invitation only. Please use a valid invitation link or contact an administrator.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use invite data if available, otherwise use defaults
      const roleData = inviteData
        ? {
            role: inviteData.role,
            department: inviteData.department,
          }
        : {
            role: "admin",
            department: "Administration",
          };

      const newUser = await signUp({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        ...roleData,
      });

      // If invite token was used, mark it as used
      if (inviteToken && inviteData && newUser) {
        try {
          await inviteService.useInviteToken(inviteToken, newUser.uid);

          // Send welcome email
          await emailService.initialize();
          await emailService.sendWelcomeEmail({
            toEmail: newUser.email,
            toName: newUser.fullName,
            role: newUser.role,
            department: newUser.department,
          });
        } catch (error) {
          console.error("Error processing invite token:", error);
          // Don't fail the signup for this
        }
      }
    } catch (err) {
      console.error("Sign up failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      if (inviteToken) {
        await signUpWithGoogle(inviteToken);
      } else if (isFirstUser) {
        await signInWithGoogle(); // First user can use regular signin
      } else {
        throw new Error("Invite token is required for registration.");
      }
    } catch (err) {
      console.error("Google sign up failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-screen bg-gray-50 font-onest overflow-hidden">
      <div className="flex flex-col items-center justify-center px-6 py-4 mx-auto h-full">
        <a
          href="#"
          className="flex items-center mb-6 text-2xl font-semibold text-gray-900"
        >
          <img
            className="w-8 h-8 mr-2"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
            alt="logo"
          />
          Veefyed Admin
        </a>

        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="p-6 space-y-3 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              {inviteToken
                ? "Accept Invitation"
                : isFirstUser
                ? "Create Super Admin Account"
                : "Create admin account"}
            </h1>

            {/* First User Information */}
            {!inviteToken && isFirstUser && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                <div className="font-medium">
                  🎉 Welcome! You're the first user!
                </div>
                <div>
                  You will automatically become the Super Administrator with
                  full access to create and manage other admin accounts.
                </div>
              </div>
            )}

            {/* Invite Information */}
            {inviteValidating && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                Validating invitation...
              </div>
            )}

            {inviteData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                <div className="font-medium">You're invited!</div>
                <div>
                  Role: {inviteData.role} • Department: {inviteData.department}
                </div>
                <div>Invited by: {inviteData.invitedByEmail}</div>
              </div>
            )}

            {/* Error Messages */}
            {errors.invite && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors.invite}
              </div>
            )}

            {!inviteToken && !isFirstUser && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                <div className="font-medium">
                  Registration by invitation only
                </div>
                <div>
                  Please use a valid invitation link or contact an administrator
                  to get invited.
                </div>
              </div>
            )}

            {errors.general && (
              <div className="text-red-600 text-sm">{errors.general}</div>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="fullName"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`${
                    errors.fullName
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  placeholder="John Doe"
                  disabled={isLoading}
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Your email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  className={`${
                    errors.email
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  placeholder="name@company.com"
                  disabled={isLoading || (inviteData && inviteData.email)}
                  readOnly={inviteData && inviteData.email}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${
                    errors.password
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  disabled={isLoading}
                  required
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${
                    errors.confirmPassword
                      ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  } rounded-lg block w-full p-2`}
                  disabled={isLoading}
                  required
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className={`w-4 h-4 border rounded bg-gray-50 focus:ring-3 ${
                      errors.agreeToTerms
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                    disabled={isLoading}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="agreeToTerms"
                    className="font-light text-gray-500"
                  >
                    I accept the{" "}
                    <a
                      className="font-medium text-blue-600 hover:underline"
                      href="#"
                    >
                      Terms and Conditions
                    </a>
                  </label>
                </div>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || (!inviteToken && !isFirstUser)}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Creating account..."
                  : isFirstUser
                  ? "Create Super Admin Account"
                  : "Create account"}
              </button>

              <div className="flex items-center justify-center">
                <hr className="w-full border-t border-gray-300" />
                <span className="px-2 text-gray-500">or</span>
                <hr className="w-full border-t border-gray-300" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2 text-center inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>

              <p className="text-sm font-light text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
