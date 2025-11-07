import React from 'react';

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Veefyed</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Support & Help Center
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to help! Get in touch with our support team for assistance with the Veefyed app.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Email Support Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6">
              <svg
                className="w-7 h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Email Support
            </h3>
            <p className="text-gray-600 mb-4">
              Send us an email and we'll get back to you within 24-48 hours.
            </p>
            <a
              href="mailto:support@veefyed.com"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              support@veefyed.com
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>

          {/* Website Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6">
              <svg
                className="w-7 h-7 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Visit Our Website
            </h3>
            <p className="text-gray-600 mb-4">
              Learn more about Veefyed and explore our resources.
            </p>
            <a
              href="https://veefyed.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              veefyed.com
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            About Veefyed
          </h3>
          <div className="space-y-4 text-gray-600">
            <p>
              Veefyed is a skincare product verification app that helps users make informed decisions about their skincare products. Our platform provides comprehensive product information, reviews, and verification services.
            </p>
            <p>
              <strong className="text-gray-900">App Name:</strong> Veefyed
            </p>
            <p>
              <strong className="text-gray-900">Category:</strong> Health & Fitness / Beauty
            </p>
            <p>
              <strong className="text-gray-900">Version:</strong> 1.0.0
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                How do I verify a product?
              </h4>
              <p className="text-gray-600">
                Simply scan the product barcode using the in-app scanner, or search for the product by name. Our database will provide you with detailed information and verification status.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                How do I report an issue?
              </h4>
              <p className="text-gray-600">
                You can report issues directly through the app's report feature, or contact us via email at support@veefyed.com with details about the problem you're experiencing.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                How do I delete my account?
              </h4>
              <p className="text-gray-600">
                To delete your account, go to Settings &gt; Account &gt; Delete Account in the app. You can also email us at support@veefyed.com to request account deletion. We will process your request within 30 days.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                What data does Veefyed collect?
              </h4>
              <p className="text-gray-600">
                We collect only the data necessary to provide our services, including account information, product reviews, and usage analytics. For full details, please review our Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Terms Links */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Legal Information
          </h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://veefyed.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700 font-medium"
            >
              Privacy Policy
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <a
              href="https://veefyed.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700 font-medium"
            >
              Terms of Service
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mt-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            Send Us a Message
          </h3>
          <p className="text-gray-600 mb-6">
            For immediate assistance, please email us directly at{' '}
            <a
              href="mailto:support@veefyed.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              support@veefyed.com
            </a>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Response Time</p>
                <p>
                  We typically respond to all inquiries within 24-48 hours during business days (Monday-Friday).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© {new Date().getFullYear()} Veefyed. All rights reserved.</p>
            <p className="text-sm">
              Skincare Product Verification App
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Support;

