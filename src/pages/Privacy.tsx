import { Layout } from "@/components/layout/Layout";

const Privacy = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-hero">
        <div className="container-tight">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-primary-foreground/70">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
                <p className="text-muted-foreground">
                  Aurora Fundraising ("we," "our," or "us") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                  information when you visit our website or engage with our fundraising services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We may collect information about you in a variety of ways:
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-2">Personal Data</h3>
                <p className="text-muted-foreground mb-4">
                  When you contact us or participate in a fundraiser, we may collect personally 
                  identifiable information, such as your name, email address, phone number, 
                  organization name, and mailing address.
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-2">Usage Data</h3>
                <p className="text-muted-foreground">
                  We may automatically collect certain information when you visit our website, 
                  including your IP address, browser type, operating system, access times, and 
                  the pages you have viewed.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide and maintain our fundraising services</li>
                  <li>Process orders and deliver products</li>
                  <li>Communicate with you about your fundraiser or inquiries</li>
                  <li>Send promotional communications (only with your explicit consent)</li>
                  <li>Improve our website and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Marketing Communications</h2>
                <p className="text-muted-foreground mb-4">
                  We will only send you marketing communications if you have explicitly opted in to receive them. 
                  You may withdraw your consent at any time by:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Clicking the "unsubscribe" link in any marketing email</li>
                  <li>Updating your preferences through our preference center</li>
                  <li>Contacting us directly at impactfulfundraising@gmail.com</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share your information with trusted service providers who assist us in 
                  operating our business, provided they agree to keep your information confidential. 
                  We may also disclose information if required by law or to protect our rights.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your 
                  personal information against unauthorized access, alteration, disclosure, or 
                  destruction. However, no method of transmission over the internet is 100% secure, 
                  and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Cookies</h2>
                <p className="text-muted-foreground">
                  Our website may use cookies to enhance your browsing experience. You can choose 
                  to disable cookies through your browser settings, though this may affect the 
                  functionality of our website.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have certain rights regarding your personal 
                  information, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>The right to access your personal information</li>
                  <li>The right to correct inaccurate information</li>
                  <li>The right to delete your information</li>
                  <li>The right to opt out of marketing communications</li>
                  <li>The right to data portability</li>
                </ul>
              </div>

              {/* COPPA Compliance Section */}
              <div className="p-6 bg-muted/50 rounded-xl border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy (COPPA Compliance)</h2>
                <p className="text-muted-foreground mb-4">
                  Aurora Fundraising is committed to complying with the Children's Online Privacy Protection Act 
                  (COPPA) and protecting the privacy of children under 13 years of age.
                </p>
                <h3 className="text-lg font-semibold text-foreground mb-2">Our Commitment:</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>We do not knowingly collect personal information from children under 13 without verifiable parental consent</li>
                  <li>Our services are directed to schools, organizations, and adult coordinators—not to children directly</li>
                  <li>Student participation in fundraisers is facilitated through adult coordinators (teachers, parents, organization administrators)</li>
                  <li>Any student accounts or profiles are created and managed by verified adult coordinators with parental/guardian consent</li>
                  <li>We do not require children to disclose more personal information than is reasonably necessary to participate in fundraising activities</li>
                </ul>
                <h3 className="text-lg font-semibold text-foreground mb-2">Parental Rights:</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Parents/guardians may review information collected about their child by contacting us</li>
                  <li>Parents/guardians may request deletion of their child's information</li>
                  <li>Parents/guardians may refuse further collection or use of their child's information</li>
                </ul>
                <h3 className="text-lg font-semibold text-foreground mb-2">Information Collected About Student Participants:</h3>
                <p className="text-muted-foreground mb-2">
                  When schools or organizations create student fundraiser pages, the following information may be collected 
                  under the direction and consent of the school/organization administrator:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Student's name (or nickname/initials as determined by the administrator)</li>
                  <li>Fundraising goal and progress</li>
                  <li>Optional: profile photo or avatar (uploaded by adult coordinator)</li>
                </ul>
                <p className="text-muted-foreground font-medium">
                  We do NOT collect from children: email addresses, home addresses, phone numbers, Social Security numbers, 
                  or any other sensitive personal information without verifiable parental consent.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain personal information only for as long as necessary to fulfill the purposes for which 
                  it was collected, including to satisfy legal, accounting, or reporting requirements. When 
                  personal information is no longer needed, we securely delete or anonymize it.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new policy on this page and updating the "Last updated" 
                  date. For material changes, we will provide more prominent notice.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, our practices, or wish to exercise your 
                  privacy rights (including COPPA-related requests), please contact us at:{" "}
                  <a href="mailto:impactfulfundraising@gmail.com" className="text-primary-blue hover:underline">
                    impactfulfundraising@gmail.com
                  </a>
                  {" "}or call us at (907) 310-8288.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
