import { Link } from 'react-router-dom'

function Terms() {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: February 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using TagSphere ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Service.
          </p>
        </section>

        <section>
          <h2>2. Service Description</h2>
          <p>
            TagSphere provides a QR code-based vehicle communication platform that allows third parties to contact vehicle owners without exposing personal phone numbers. The service includes:
          </p>
          <ul>
            <li>QR code generation and linking to registered vehicles</li>
            <li>Anonymous communication bridge between scanners and vehicle owners</li>
            <li>Scan notifications and alerts</li>
            <li>Subscription-based premium features</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <ul>
            <li>You must provide accurate and complete registration information</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must be at least 18 years old to use the Service</li>
            <li>One account per person; multiple accounts are not permitted</li>
            <li>You must not use the service for any illegal or unauthorized purpose</li>
          </ul>
        </section>

        <section>
          <h2>4. Subscriptions & Payments</h2>
          <ul>
            <li>Subscription plans are billed monthly at the stated price</li>
            <li>Payments are processed securely through Razorpay</li>
            <li>Subscriptions are valid for 30 days from the date of payment</li>
            <li>No automatic renewal; you must manually renew your subscription</li>
            <li>Refunds are subject to our refund policy and evaluated on a case-by-case basis</li>
            <li>We reserve the right to change pricing with 30 days notice</li>
          </ul>
        </section>

        <section>
          <h2>5. QR Code Usage</h2>
          <ul>
            <li>QR codes are for personal vehicle identification only</li>
            <li>Do not use QR codes for commercial advertising or spam</li>
            <li>Misuse of the alert system (false emergencies, harassment) may result in account suspension</li>
            <li>TagSphere is not responsible for physical damage to QR stickers</li>
          </ul>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>
            TagSphere provides the Service "as is" without warranties of any kind. We are not liable for:
          </p>
          <ul>
            <li>Missed notifications or delayed alerts</li>
            <li>Actions taken by third parties who scan your QR code</li>
            <li>Any damages resulting from the use or inability to use the Service</li>
            <li>Loss of data due to technical failures</li>
          </ul>
          <p>
            Our total liability shall not exceed the amount paid by you for the Service in the preceding 12 months.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these Terms. You may deactivate your account at any time through your dashboard. Upon termination, your QR codes will stop functioning.
          </p>
        </section>

        <section>
          <h2>8. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of significant changes via email or in-app notification.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            For questions about these Terms, contact us at:{' '}
            <a href="mailto:contact@tagsphere.co.in">contact@tagsphere.co.in</a>
          </p>
        </section>

        <div className="legal-back">
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

export default Terms
