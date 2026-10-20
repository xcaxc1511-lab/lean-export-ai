import { businessConfig } from "@/config/business";

export default function TermsAndConditionsPage() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="py-24 md:py-32 bg-background">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
            Terms of Service
          </h1>
          <p className="mb-2 text-lg text-muted-foreground font-medium text-center">
            {businessConfig.businessName}
          </p>
          <p className="mb-6 text-sm text-muted-foreground text-center">
            Effective Date: Jan 1st, {currentYear}
          </p>

          <hr className="border-border mb-12" />

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                SMS Messaging Terms & Compliance
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    1. Program Description:
                  </h3>
                  <p>
                    This messaging program sends appointment confirmation and reminder messages to
                    customers who have booked an appointment with {businessConfig.businessName}{" "}
                    through our website at{" "}
                    <a href={businessConfig.website} className="text-primary hover:underline">
                      {businessConfig.website}
                    </a>
                    , or via our scheduling forms, and have explicitly opted in to receive SMS
                    notifications. Opt-in is collected via web forms with a dedicated checkbox for
                    SMS consent. Messages include scheduling confirmations, appointment reminders,
                    rescheduling updates, and customer support communications.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    2. Cancellation Instructions:
                  </h3>
                  <p>
                    You can cancel the SMS service at any time. Simply text "STOP" to the same
                    number that sent you messages. Upon sending "STOP," we will confirm your
                    unsubscribe status via SMS. Following this confirmation, you will no longer
                    receive SMS messages from us. To rejoin, sign up as you did initially, and we
                    will resume sending SMS messages.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    3. Support Information:
                  </h3>
                  <p>
                    If you experience issues with the messaging program, reply with the keyword
                    "HELP" for more assistance, or reach out directly to{" "}
                    <a
                      href={`mailto:${businessConfig.email}`}
                      className="text-primary hover:underline"
                    >
                      {businessConfig.email}
                    </a>{" "}
                    or call {businessConfig.phone} during business hours.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">4. Carrier Liability:</h3>
                  <p>Carriers are not liable for delayed or undelivered messages.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    5. Message & Data Rates:
                  </h3>
                  <p>
                    Message and data rates may apply for messages sent to you from us and to us from
                    you. Message frequency varies based on your service usage and appointment
                    schedule. For questions about your text plan or data plan, contact your wireless
                    provider.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">6. Supported Carriers:</h3>
                  <p>
                    Our SMS program works with all major U.S. wireless carriers, including AT&T,
                    T-Mobile, Verizon, Sprint, and most regional carriers.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">7. Age Restriction:</h3>
                  <p>You must be 18 years or older to participate in our SMS program.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">8. Privacy Policy:</h3>
                  <p>
                    For privacy-related inquiries, please refer to our Privacy Policy at{" "}
                    <a
                      href={`${businessConfig.website}/privacy-policy`}
                      className="text-primary hover:underline"
                    >
                      {businessConfig.website}/privacy-policy
                    </a>
                  </p>
                </div>

                <p className="mt-6">
                  We comply with all applicable laws and regulations, including the Telephone
                  Consumer Protection Act (TCPA) and CTIA guidelines, regarding the use of SMS
                  communications.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">General Terms</h2>

              <div className="space-y-6">
                <p>
                  This website (the "Site") is owned and operated by {businessConfig.businessName}{" "}
                  ("COMPANY," "we" or "us"). By using the Site, you agree to be bound by these Terms
                  of Service and to use the Site in accordance with these Terms of Service, our
                  Privacy Policy, and any additional terms and conditions that may apply to specific
                  sections of the Site or to products and services available through the Site or
                  from {businessConfig.businessName}.
                </p>
                <p>
                  Accessing the Site, in any manner, whether automated or otherwise, constitutes use
                  of the Site and your agreement to be bound by these Terms of Service.
                </p>
                <p>
                  We reserve the right to change these Terms of Service or to impose new conditions
                  on the use of the Site from time to time, in which case we will post the revised
                  Terms of Service on this website. By continuing to use the Site after we post any
                  such changes, you accept the Terms of Service, as modified.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Intellectual Property Rights
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    Our Limited License to You
                  </h3>
                  <p className="mb-4">
                    This Site and all the materials available on the Site are the property of{" "}
                    {businessConfig.businessName} and/or our affiliates or licensors and are
                    protected by copyright, trademark, and other intellectual property laws. The
                    Site is provided solely for your personal non-commercial use.
                  </p>
                  <p className="mb-4">
                    You may not use the Site or the materials available on the Site in a manner that
                    constitutes an infringement of our rights or that has not been authorized by us.
                  </p>
                  <p>
                    Unless explicitly authorized, you may not modify, copy, reproduce, republish,
                    upload, post, transmit, translate, sell, create derivative works, exploit, or
                    distribute in any manner or medium any material from the Site. However, you may
                    download and/or print one copy of individual pages for your personal,
                    non-commercial use, provided that you keep intact all copyright and other
                    proprietary notices.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Your License to Us</h3>
                  <p>
                    By posting or submitting any material (including comments, blog entries, social
                    media posts, photos, and videos) to us via the Site, internet groups, or other
                    digital venues, you represent that you own the material or have obtained the
                    necessary permissions. You grant us a royalty-free, perpetual, irrevocable,
                    non-exclusive, worldwide license to use, modify, transmit, sell, exploit, create
                    derivative works from, distribute, and publicly perform or display such
                    material.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Disclaimers</h2>

              <div className="space-y-6">
                <p>
                  Throughout the Site, we may provide links and pointers to Internet sites
                  maintained by third parties. Our linking to such third-party sites does not imply
                  an endorsement or sponsorship of such sites or the information, products, or
                  services offered on or through the sites.
                </p>
                <p>
                  The information, products, and services offered on or through the Site are
                  provided "as is" and without warranties of any kind, either express or implied. To
                  the fullest extent permissible pursuant to applicable law, we disclaim all
                  warranties, including implied warranties of merchantability and fitness for a
                  particular purpose.
                </p>
                <p>
                  You agree at all times to indemnify and hold harmless{" "}
                  {businessConfig.businessName}, its affiliates, and their respective officers,
                  directors, agents, and employees from any claims, causes of action, damages,
                  liabilities, costs, and expenses arising out of or related to your breach of any
                  obligation, warranty, or representation under these Terms of Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Online Commerce</h2>

              <div className="space-y-6">
                <p>
                  Certain sections of the Site may allow you to purchase products and services from
                  third-party vendors. We are not responsible for the quality, accuracy, timeliness,
                  reliability, or any other aspect of these products and services. If you make a
                  purchase from a third party linked through the Site, the information obtained
                  during your visit, including payment information, may be collected by both the
                  merchant and us.
                </p>
                <p>
                  Your participation in any dealings with third-party vendors is solely between you
                  and the third party. {businessConfig.businessName} shall not be responsible for
                  any loss or damage incurred as a result of such dealings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Registration &amp; Passwords
              </h2>

              <div className="space-y-6">
                <p>
                  To access certain features of the Site, you may be required to register and create
                  an account. You agree to provide accurate, current, and complete information
                  during the registration process. You are responsible for maintaining the
                  confidentiality of your login credentials and for all activities conducted under
                  your account.
                </p>
                <p>
                  If you suspect unauthorized use of your account, notify us immediately at{" "}
                  <a
                    href={`mailto:${businessConfig.email}`}
                    className="text-primary hover:underline"
                  >
                    {businessConfig.email}
                  </a>
                  . We are not liable for any loss or damage arising from your failure to comply
                  with this obligation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Termination</h2>
              <p>
                We reserve the right to terminate or suspend your access to the Site, without
                notice, if we determine that you have violated these Terms of Service or engaged in
                conduct that we deem inappropriate or unlawful. Upon termination, you must cease all
                use of the Site and any content obtained from it.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the
                laws of the state in which {businessConfig.businessName} operates. Any dispute
                arising under these Terms shall be resolved exclusively through binding arbitration
                in that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Changes to Terms of Service
              </h2>
              <p>
                We may update these Terms of Service from time to time. The latest version will
                always be available on our website with the effective date.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Contact Us</h2>
              <p className="mb-4">
                For any questions regarding these Terms of Service, please contact us at:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>{businessConfig.businessName}</strong>
                </p>
                <p>Phone: {businessConfig.phone}</p>
                <p>
                  Email:{" "}
                  <a
                    href={`mailto:${businessConfig.email}`}
                    className="text-primary hover:underline"
                  >
                    {businessConfig.email}
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <a href={businessConfig.website} className="text-primary hover:underline">
                    {businessConfig.website}
                  </a>
                </p>
              </div>
              <p className="mt-6">
                By using our website and services, you consent to these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
