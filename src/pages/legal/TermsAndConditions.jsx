const DocumentIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const Section = ({ number, title, icon, children }) => (
  <div style={{ marginBottom: "2rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "10px",
        background: "#eef2ff", color: "#4f46e5",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
        {number}. {title}
      </h2>
    </div>
    <div style={{ paddingLeft: "46px", lineHeight: 1.85, color: "#475569", fontSize: "0.95rem" }}>
      {children}
    </div>
  </div>
);

const ContactLink = () => (
  <a
    href="https://noteshub-app.onrender.com/contact"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none", borderBottom: "1.5px solid #c7d2fe" }}
  >
    Contact Us
  </a>
);

const Divider = () => (
  <hr style={{ border: "none", borderTop: "1.5px solid #f1f5f9", marginBottom: "2rem" }} />
);

const TermsAndConditions = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <main style={{ width: "100%", maxWidth: 1200, margin: "auto", padding: "28px 20px" }}>

        <div style={{
          background: "white", padding: 40, borderRadius: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
          marginBottom: "2rem",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem", background: "#eef2ff", color: "#4f46e5",
          }}>
            <DocumentIcon />
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.75rem", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ fontSize: "1rem", color: "#64748b", margin: "0 0 0.5rem", lineHeight: 1.7 }}>
            Last updated: November 2026
          </p>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: 0, lineHeight: 1.7 }}>
            Please read these Terms &amp; Conditions carefully before using NotesHub. By accessing or using the platform, you agree to be bound by these terms.
          </p>
        </div>

        <div style={{
          background: "white", padding: "3rem 3.5rem", borderRadius: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
        }}>

          <Section number="1" title="Acceptance of Terms" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              By accessing or using NotesHub, you confirm that you are at least 13 years of age and have read, understood, and agree to be bound by these Terms &amp; Conditions. If you do not agree to these terms, you must not use the platform.
            </p>
            <p style={{ margin: 0 }}>
              These terms apply to all visitors, registered users, and anyone who accesses or uses the platform in any way.
            </p>
          </Section>

          <Divider />

          <Section number="2" title="About NotesHub" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub is an independent educational platform created to help students access study materials in an organized and user-friendly manner. While we aim to provide accurate and helpful academic resources, we do not guarantee that all content is completely error-free or updated at all times.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              The materials provided on NotesHub may include notes, previous question papers, subject references, or academic resources collected from various public and educational sources. These materials are shared only for learning and reference purposes.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub is not officially affiliated with any university, board, or academic institution unless explicitly stated. All university names, logos, and academic references belong to their respective owners.
            </p>
            <p style={{ margin: 0 }}>
              Students are strongly advised to verify important academic information such as syllabus updates, exam schedules, and official notices directly from their university or institute websites.
            </p>
          </Section>

          <Divider />

          <Section number="3" title="User Registration and Account Security" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              To access certain features including paid notes, you must register and maintain an account on NotesHub. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. NotesHub reserves the right to suspend or terminate accounts found to contain false or misleading information.
            </p>
            <p style={{ margin: 0 }}>
              You must notify us immediately of any unauthorized use of your account. NotesHub will not be liable for any losses resulting from unauthorized account access due to your failure to protect your credentials.
            </p>
          </Section>

          <Divider />

          <Section number="4" title="Permitted Use of Study Materials" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              All study materials available on NotesHub are intended solely for personal, non-commercial educational use. You may access and read materials for your own learning purposes only.
            </p>
            <p style={{ margin: 0 }}>You are strictly prohibited from:</p>
            <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0" }}>
              <li style={{ marginBottom: "0.4rem" }}>Redistributing, reselling, or sharing paid materials with others</li>
              <li style={{ marginBottom: "0.4rem" }}>Uploading, reproducing, or publishing NotesHub content on any other platform</li>
              <li style={{ marginBottom: "0.4rem" }}>Using automated tools to scrape or download content in bulk</li>
              <li style={{ marginBottom: "0.4rem" }}>Circumventing any technical measures used to protect paid content</li>
              <li style={{ marginBottom: "0" }}>Using content for commercial purposes without prior written consent</li>
            </ul>
          </Section>

          <Divider />

          <Section number="5" title="Free Notes and Paid Notes" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub offers two categories of study materials: free notes and paid notes. Free notes are accessible to all users without any payment. Paid notes require a one-time purchase to unlock access.
            </p>
            <p style={{ margin: 0 }}>
              Paid notes are curated, exam-focused materials prepared specifically for academic performance. Access to paid notes is subject to successful payment verification and device registration as described in Section 6.
            </p>
          </Section>

          <Divider />

          <Section number="6" title="Paid Notes Access and Device Restriction" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              Upon successful purchase, access to paid notes is registered to the specific device used at the time of purchase. This device binding is enforced through a combination of device fingerprinting and a secure device token.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              Paid notes cannot be accessed from a different device without following the official device recovery process. If you change your device or lose access, you may submit a device recovery request through the platform. Recovery requests are subject to admin review and approval, and NotesHub reserves the right to approve or reject such requests at its discretion.
            </p>
            <p style={{ margin: 0 }}>
              Attempting to bypass device restrictions, share access credentials, or use the content from unauthorized devices may result in immediate suspension of your account and forfeiture of purchased access without refund.
            </p>
          </Section>

          <Divider />

          <Section number="7" title="Payments and Razorpay Integration" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              All payments on NotesHub are processed securely through Razorpay, a third-party payment gateway. By making a payment, you also agree to Razorpay's terms of service and privacy policy.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub does not store your card or banking details. Payment information is handled entirely by Razorpay's secure infrastructure.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              Access to paid notes is granted only after server-side payment verification is completed successfully. If payment is deducted but access is not granted due to a technical issue, please contact our support team with your payment details.
            </p>
            <p style={{ margin: 0 }}>
              In cases of payment failure, the amount is not deducted. If a deduction occurs on a failed payment, it will be automatically refunded by your bank or Razorpay within the standard processing period.
            </p>
          </Section>

          <Divider />

          <Section number="8" title="Refund and Cancellation Policy" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              All successfully completed payments on NotesHub are strictly non-refundable. Once a payment is processed and access is granted, no refund will be issued under any circumstances including accidental purchases, change of mind, dissatisfaction with content, or device-related access issues.
            </p>
            <p style={{ margin: 0 }}>
              We strongly encourage users to carefully review the note details, pricing, and all applicable terms before proceeding with any payment. If you have questions about a note before purchasing, please contact our support team.
            </p>
          </Section>

          <Divider />

          <Section number="9" title="Pricing and Coupon Policies" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              Prices for paid notes are set by NotesHub and are displayed in Indian Rupees (INR). NotesHub reserves the right to change pricing at any time without prior notice.
            </p>
            <p style={{ margin: "0 0 0.75rem" }}>
              Discount coupons may be issued by NotesHub at its discretion. Coupons are single-use, non-transferable, and valid only for the specific note and duration mentioned. Coupons cannot be exchanged for cash and have no monetary value outside the platform.
            </p>
            <p style={{ margin: 0 }}>
              NotesHub reserves the right to revoke coupons that are found to be misused, shared without authorization, or applied fraudulently. Revoked coupons will not be replaced.
            </p>
          </Section>

          <Divider />

          <Section number="10" title="Copyright and Intellectual Property" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              All original content created by NotesHub, including but not limited to paid notes, platform design, branding, and written materials, is the intellectual property of NotesHub and is protected under applicable copyright laws.
            </p>
            <p style={{ margin: 0 }}>
              We do not claim ownership over third-party academic content such as university syllabi, publicly available question papers, or referenced materials. If you believe any content on NotesHub infringes your intellectual property rights, please contact us for prompt review and removal if required.
            </p>
          </Section>

          <Divider />

          <Section number="11" title="Third-Party Content and University Affiliation" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub is not officially affiliated with Mumbai University, MSBTE, or any other academic institution unless explicitly stated. All university names, logos, and academic references used on the platform belong to their respective owners and are referenced solely for educational identification purposes.
            </p>
            <p style={{ margin: 0 }}>
              Some materials on NotesHub may reference or be derived from publicly available academic content. Such content is shared strictly for educational purposes and not for commercial gain.
            </p>
          </Section>

          <Divider />

          <Section number="12" title="User Responsibilities" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.5rem" }}>As a user of NotesHub, you agree to:</p>
            <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
              <li style={{ marginBottom: "0.4rem" }}>Use the platform only for lawful, personal educational purposes</li>
              <li style={{ marginBottom: "0.4rem" }}>Not attempt to hack, reverse-engineer, or disrupt the platform</li>
              <li style={{ marginBottom: "0.4rem" }}>Not share your account credentials or paid content with others</li>
              <li style={{ marginBottom: "0.4rem" }}>Not use bots, scrapers, or automated tools to access the platform</li>
              <li style={{ marginBottom: "0.4rem" }}>Provide accurate information during registration and payment</li>
              <li style={{ marginBottom: "0" }}>Comply with all applicable local and national laws while using NotesHub</li>
            </ul>
          </Section>

          <Divider />

          <Section number="13" title="Limitation of Liability" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>NotesHub will not be held responsible for:</p>
            <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.75rem" }}>
              <li style={{ marginBottom: "0.4rem" }}>Any academic loss caused by incorrect or outdated information on the platform</li>
              <li style={{ marginBottom: "0.4rem" }}>Loss of data, results, marks, or exam-related misunderstandings</li>
              <li style={{ marginBottom: "0.4rem" }}>Technical interruptions, website downtime, or service delays</li>
              <li style={{ marginBottom: "0.4rem" }}>Any reliance placed on the materials available on the platform</li>
              <li style={{ marginBottom: "0" }}>Unauthorized access to your account resulting from your own negligence</li>
            </ul>
            <p style={{ margin: 0 }}>
              The platform is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.
            </p>
          </Section>

          <Divider />

          <Section number="14" title="Service Availability and Modifications" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub reserves the right to modify, suspend, or discontinue any part of the platform at any time without prior notice. This includes adding or removing notes, changing pricing, updating features, or performing maintenance.
            </p>
            <p style={{ margin: 0 }}>
              We will make reasonable efforts to maintain platform availability, but do not guarantee uninterrupted access. Scheduled or unscheduled downtime may occur and NotesHub will not be liable for any inconvenience caused.
            </p>
          </Section>

          <Divider />

          <Section number="15" title="Account Suspension and Termination" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub reserves the right to suspend or permanently terminate any account that violates these Terms &amp; Conditions, engages in fraudulent activity, attempts to bypass security measures, or misuses the platform in any way.
            </p>
            <p style={{ margin: 0 }}>
              Upon termination, your access to all purchased content will be revoked without refund. You may also be barred from creating new accounts on the platform.
            </p>
          </Section>

          <Divider />

          <Section number="16" title="Privacy and Data Protection" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub collects and processes user data including name, email address, device information, and payment-related records solely for the purpose of providing the platform's services. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
            <p style={{ margin: 0 }}>
              Device fingerprinting is used exclusively for the purpose of enforcing paid note access restrictions as described in Section 6. By purchasing a paid note, you consent to this device identification process.
            </p>
          </Section>

          <Divider />

          <Section number="17" title="Changes to Terms" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              NotesHub reserves the right to update or modify these Terms &amp; Conditions at any time. Changes will be effective immediately upon posting to the platform. The "Last updated" date at the top of this page will reflect the most recent revision.
            </p>
            <p style={{ margin: 0 }}>
              Continued use of NotesHub after any changes constitutes your acceptance of the updated terms. We recommend reviewing this page periodically.
            </p>
          </Section>

          <Divider />

          <Section number="18" title="Contact and Support" icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          }>
            <p style={{ margin: "0 0 0.75rem" }}>
              If you have any questions about these Terms &amp; Conditions, face issues with payments, device access, or need any technical assistance, please reach out to us through our <ContactLink /> page.
            </p>
            <p style={{ margin: 0 }}>
              We aim to respond to all support queries promptly and will do our best to resolve your concern in a timely manner.
            </p>
          </Section>

        </div>

      </main>
    </div>
  );
};

export default TermsAndConditions;