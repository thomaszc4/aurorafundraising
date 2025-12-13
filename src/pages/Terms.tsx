import { Layout } from "@/components/layout/Layout";

const Terms = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-hero">
        <div className="container-tight">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
            Terms & Conditions
          </h1>
          <p className="text-primary-foreground/70">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-background relative">
        <div className="container-tight relative z-10">
          <div className="glass-card p-8 md:p-12 prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary-blue prose-strong:text-foreground">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Agreement to Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using the Aurora Fundraising website and services, you agree to
                  be bound by these Terms and Conditions. If you disagree with any part of these
                  terms, you may not access our website or use our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Eligibility and Age Requirements</h2>
                <p className="text-muted-foreground mb-4">
                  Our fundraising platform services are designed for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Schools, non-profit organizations, community groups, and other legitimate fundraising entities</li>
                  <li>Adults (18 years or older) who are authorized to act on behalf of their organization</li>
                  <li>Parents/guardians who provide consent for their children's participation in fundraising activities</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Student participants under 18 may only use our platform under the supervision and with
                  the consent of a parent, guardian, or authorized school/organization administrator.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Use of Services</h2>
                <p className="text-muted-foreground mb-4">
                  By using our services, you represent that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You are at least 18 years old or have verifiable parental/guardian consent</li>
                  <li>You have the authority to enter into this agreement on behalf of your organization</li>
                  <li>Your use of our services is for legitimate fundraising purposes</li>
                  <li>All information you provide is accurate and complete</li>
                  <li>You will comply with all applicable laws including COPPA when involving minors</li>
                </ul>
              </div>

              {/* COPPA Section */}
              <div className="p-6 bg-muted/50 rounded-xl border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-4">Children's Online Privacy Protection Act (COPPA) Compliance</h2>
                <p className="text-muted-foreground mb-4">
                  Aurora Fundraising is committed to complying with COPPA and protecting children's privacy online.
                </p>
                <h3 className="text-lg font-semibold text-foreground mb-2">For Organization Administrators and Teachers:</h3>
                <p className="text-muted-foreground mb-4">
                  When creating student fundraiser pages or accounts, you represent and warrant that you:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Are acting as an authorized agent of the school or organization</li>
                  <li>Have obtained all necessary parental consents before collecting or submitting information about children under 13</li>
                  <li>Will limit the collection of children's information to what is reasonably necessary for participation</li>
                  <li>Will protect the confidentiality, security, and integrity of children's information</li>
                  <li>Will not disclose children's information to unauthorized third parties</li>
                  <li>Understand that you may only consent to the collection of a student's information for educational purposes related to the fundraiser</li>
                </ul>
                <h3 className="text-lg font-semibold text-foreground mb-2">For Parents and Guardians:</h3>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Review information collected about your child</li>
                  <li>Request deletion of your child's information</li>
                  <li>Refuse further collection or use of your child's information</li>
                  <li>Consent to collection without consenting to disclosure to third parties</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, contact us at impactfulfundraising@gmail.com or (907) 310-8288.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Marketing Communications</h2>
                <p className="text-muted-foreground mb-4">
                  We only send marketing communications to individuals who have explicitly opted in.
                  By opting in to marketing communications, you acknowledge that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Your consent is voluntary and not a condition of any purchase or donation</li>
                  <li>You may withdraw consent at any time via the unsubscribe link or by contacting us</li>
                  <li>You are at least 18 years old or have parental/guardian consent</li>
                  <li>Message frequency may vary; standard message and data rates may apply</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Orders and Payment</h2>
                <p className="text-muted-foreground mb-4">
                  When placing orders through Aurora Fundraising:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>All orders are subject to product availability</li>
                  <li>Prices are subject to change without notice until an order is confirmed</li>
                  <li>Payment terms will be outlined in your fundraising agreement</li>
                  <li>Organizations are responsible for collecting payments from supporters</li>
                  <li>Orders may be cancelled or modified according to the terms of your agreement</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Products and Delivery</h2>
                <p className="text-muted-foreground mb-4">
                  We strive to deliver quality products in a timely manner. However:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Delivery times are estimates and not guaranteed</li>
                  <li>Risk of loss passes to the organization upon delivery</li>
                  <li>Products may vary slightly from images shown on our website</li>
                  <li>Defective products should be reported within 14 days of delivery</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Returns and Refunds</h2>
                <p className="text-muted-foreground">
                  Due to the nature of fundraising orders, all sales are generally final. However,
                  we will work with organizations to address defective products or order errors.
                  Please contact us within 14 days of receiving your order to report any issues.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content on our website, including text, graphics, logos, and images, is the
                  property of Aurora Fundraising or its content suppliers. You may not reproduce,
                  distribute, or create derivative works from this content without our express
                  written permission.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the fullest extent permitted by law, Aurora Fundraising shall not be liable
                  for any indirect, incidental, special, consequential, or punitive damages arising
                  from your use of our services or products. Our total liability shall not exceed
                  the amount paid by you for the specific products or services giving rise to the claim.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold Aurora Fundraising harmless from any claims,
                  damages, losses, or expenses arising from your use of our services, your violation
                  of these terms, or your violation of any rights of another party.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms and Conditions shall be governed by and construed in accordance with
                  the laws of the United States, without regard to conflict of law principles.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms and Conditions at any time. Changes
                  will be effective immediately upon posting to our website. Your continued use of
                  our services after changes are posted constitutes acceptance of the modified terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Severability</h2>
                <p className="text-muted-foreground">
                  If any provision of these Terms and Conditions is found to be unenforceable, the
                  remaining provisions will continue in full force and effect.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms and Conditions, please contact us at{" "}
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

export default Terms;
