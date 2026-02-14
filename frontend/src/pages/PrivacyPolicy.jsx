import { Link } from 'react-router-dom'

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: February 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            When you register on TagSphere, we collect the following information:
          </p>
          <ul>
            <li><strong>Phone Number:</strong> Required for account registration and vehicle owner verification. Your phone number is encrypted at rest and never shared with scanners.</li>
            <li><strong>Name:</strong> Used to identify you on the platform.</li>
            <li><strong>Vehicle Information:</strong> Vehicle number, type, and color for QR code registration.</li>
            <li><strong>Payment Information:</strong> Processed securely through Razorpay. We do not store your card details.</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain our vehicle contact service</li>
            <li>To send notifications when your vehicle QR code is scanned</li>
            <li>To process subscription payments</li>
            <li>To improve our services and user experience</li>
            <li>To communicate important updates about your account</li>
          </ul>
        </section>

        <section>
          <h2>3. QR Scan Data</h2>
          <p>
            When someone scans your vehicle's QR code, we collect:
          </p>
          <ul>
            <li>The time and date of the scan</li>
            <li>The type of action taken (view, call, alert)</li>
            <li>Anonymous scanner information for rate limiting and abuse prevention</li>
          </ul>
          <p>
            Scanner identities are not linked to personal accounts. Scan data is used solely for providing the service and generating scan statistics for vehicle owners.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We take data security seriously:
          </p>
          <ul>
            <li>Phone numbers are encrypted using AES-256-GCM encryption</li>
            <li>All API communications use HTTPS/TLS</li>
            <li>Authentication tokens expire after 7 days</li>
            <li>Rate limiting prevents abuse of our services</li>
            <li>Payment processing is handled by Razorpay's PCI-DSS compliant infrastructure</li>
          </ul>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Firebase:</strong> For phone number authentication</li>
            <li><strong>Razorpay:</strong> For payment processing</li>
            <li><strong>MongoDB Atlas:</strong> For secure data storage</li>
          </ul>
          <p>Each third-party service has its own privacy policy governing data handling.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <ul>
            <li>Access your personal data stored on our platform</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2>7. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at:{' '}
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

export default PrivacyPolicy
