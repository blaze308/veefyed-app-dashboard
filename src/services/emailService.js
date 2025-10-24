/**
 * Email Service for sending invite emails
 * This is a simple implementation using EmailJS (client-side)
 * For production, consider using a backend service like SendGrid, Nodemailer, etc.
 */

class EmailService {
  constructor() {
    // EmailJS configuration - using Vite environment variables
    this.emailJSServiceId = import.meta.env?.VITE_EMAILJS_SERVICE_ID;
    this.emailJSTemplateId = import.meta.env?.VITE_EMAILJS_TEMPLATE_ID;
    this.emailJSPublicKey = import.meta.env?.VITE_EMAILJS_PUBLIC_KEY;
  }

  /**
   * Initialize EmailJS
   */
  async initialize() {
    try {
      // Only load EmailJS if configuration is available
      if (
        this.emailJSServiceId &&
        this.emailJSTemplateId &&
        this.emailJSPublicKey
      ) {
        const emailjs = await import("emailjs-com");
        emailjs.init(this.emailJSPublicKey);
        this.emailjs = emailjs;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to initialize EmailJS:", error);
      return false;
    }
  }

  /**
   * Send invite email
   */
  async sendInviteEmail({
    toEmail,
    toName,
    inviteUrl,
    invitedByName,
    invitedByEmail,
    role,
    department,
    expiresAt,
  }) {
    try {
      // If EmailJS is not configured, use fallback method
      if (!this.emailjs) {
        return this.sendEmailFallback({
          toEmail,
          toName,
          inviteUrl,
          invitedByName,
          role,
          department,
        });
      }

      const templateParams = {
        to_email: toEmail,
        to_name: toName,
        invite_url: inviteUrl,
        invited_by_name: invitedByName,
        invited_by_email: invitedByEmail,
        role: role,
        department: department,
        expires_at: new Date(expiresAt).toLocaleDateString(),
        company_name: "Veefyed",
      };

      const response = await this.emailjs.send(
        this.emailJSServiceId,
        this.emailJSTemplateId,
        templateParams
      );

      if (response.status === 200) {
        return { success: true, message: "Invite email sent successfully" };
      } else {
        throw new Error(`EmailJS failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending invite email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fallback method when EmailJS is not configured
   * Opens default email client with pre-filled invite
   */
  sendEmailFallback({
    toEmail,
    toName,
    inviteUrl,
    invitedByName,
    role,
    department,
  }) {
    try {
      const subject = encodeURIComponent(
        "You're invited to join Veefyed Admin Panel"
      );
      const body = encodeURIComponent(`Hi ${toName},

You've been invited by ${invitedByName} to join the Veefyed Admin Panel as a ${role} in the ${department} department.

Click the link below to accept your invitation and create your account:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
The Veefyed Team`);

      const mailtoUrl = `mailto:${toEmail}?subject=${subject}&body=${body}`;
      window.open(mailtoUrl);

      return {
        success: true,
        message:
          "Email client opened with invite details. Please send the email manually.",
      };
    } catch (error) {
      console.error("Error with email fallback:", error);
      return { success: false, error: "Failed to open email client" };
    }
  }

  /**
   * Send welcome email after successful signup
   */
  async sendWelcomeEmail({ toEmail, toName, role, department }) {
    try {
      if (!this.emailjs) {
        // Simple welcome message fallback
        console.log(`Welcome email would be sent to ${toEmail} (${toName})`);
        return {
          success: true,
          message: "Welcome email logged (no email service configured)",
        };
      }

      const templateParams = {
        to_email: toEmail,
        to_name: toName,
        role: role,
        department: department,
        company_name: "Veefyed",
        dashboard_url: `${window.location.origin}/dashboard`,
      };

      // You would need a separate welcome email template in EmailJS
      await this.emailjs.send(
        this.emailJSServiceId,
        "welcome_template", // Different template for welcome emails
        templateParams
      );

      return { success: true, message: "Welcome email sent successfully" };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate email configuration
   */
  isConfigured() {
    return !!(
      this.emailJSServiceId &&
      this.emailJSTemplateId &&
      this.emailJSPublicKey
    );
  }

  /**
   * Get email template for manual sending
   */
  getInviteEmailTemplate({
    toName,
    inviteUrl,
    invitedByName,
    role,
    department,
    expiresAt,
  }) {
    return {
      subject: "You're invited to join Veefyed Admin Panel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Veefyed Admin Panel</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333;">You're Invited!</h2>
            
            <p>Hi ${toName},</p>
            
            <p>You've been invited by ${invitedByName} to join the Veefyed Admin Panel as a <strong>${role}</strong> in the <strong>${department}</strong> department.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This invitation will expire on ${new Date(
                expiresAt
              ).toLocaleDateString()}.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you can't click the button above, copy and paste this link into your browser:<br>
              <a href="${inviteUrl}">${inviteUrl}</a>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Best regards,<br>The Veefyed Team</p>
          </div>
        </div>
      `,
      text: `Hi ${toName},

You've been invited by ${invitedByName} to join the Veefyed Admin Panel as a ${role} in the ${department} department.

Click the link below to accept your invitation and create your account:
${inviteUrl}

This invitation will expire on ${new Date(expiresAt).toLocaleDateString()}.

Best regards,
The Veefyed Team`,
    };
  }
}

// Create singleton instance
const emailService = new EmailService();
export default emailService;
