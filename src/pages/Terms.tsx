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
      <section className="section-padding bg-background">
        <div className="container-tight">
          <div className="prose prose-lg max-w-none">
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
                <h2 className="text-2xl font-bold text-foreground mb-4">Use of Services</h2>
                <p className="text-muted-foreground mb-4">
                  Our fundraising services are designed for schools, non-profit organizations, 
                  community groups, and other legitimate fundraising entities. By using our services, 
                  you represent that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You are at least 18 years old or have parental consent</li>
                  <li>You have the authority to enter into this agreement on behalf of your organization</li>
                  <li>Your use of our services is for legitimate fundraising purposes</li>
                  <li>All information you provide is accurate and complete</li>
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
                  <a href="mailto:info@aurorafundraising.com" className="text-primary-blue hover:underline">
                    info@aurorafundraising.com
                  </a>
                  .
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
