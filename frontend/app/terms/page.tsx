import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Read the terms and conditions governing the use of ShareLive subdomain services.',
};

const sections = [
  {
    heading: '1. Acceptance of Terms',
    body: [
      'By accessing or using ShareLive, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, you may not use our services.',
    ],
  },
  {
    heading: '2. Description of Service',
    body: [
      'ShareLive provides subdomain routing services that connect your existing deployments to branded subdomains under sharelive.me.',
      'We do not host your application. ShareLive routes traffic to your deployment via proxy or DNS configuration depending on your plan.',
    ],
  },
  {
    heading: '3. User Accounts',
    body: [
      'You must provide accurate and complete information when creating an account.',
      'You are responsible for maintaining the security of your account credentials.',
      'You must notify us immediately of any unauthorized use of your account.',
    ],
  },
  {
    heading: '4. Acceptable Use',
    body: [
      'You agree not to use ShareLive to host, link to, or distribute content that is illegal, harmful, threatening, defamatory, obscene, or otherwise objectionable.',
      'You may not use our services to violate any applicable laws or regulations.',
      "You may not attempt to gain unauthorized access to ShareLive systems or other users' accounts.",
      'We reserve the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    heading: '5. Intellectual Property',
    body: [
      'ShareLive and its original content, features, and functionality are owned by Chaitanya Shinde and are protected by international copyright, trademark, and other intellectual property laws.',
      'You retain ownership of the content you connect through ShareLive subdomains.',
    ],
  },
  {
    heading: '6. Service Availability',
    body: [
      'We strive to maintain high availability but do not guarantee uninterrupted service.',
      'We may modify, suspend, or discontinue any aspect of the service at any time.',
      'Scheduled maintenance will be communicated in advance when possible.',
    ],
  },
  {
    heading: '7. Pricing & Payments',
    body: [
      'Free tier services are provided at no cost with limited features.',
      'Paid plans are billed according to the pricing displayed at the time of purchase.',
      'We reserve the right to change pricing with 30 days\' notice to existing subscribers.',
    ],
  },
  {
    heading: '8. Limitation of Liability',
    body: [
      'ShareLive is provided "as is" without warranties of any kind, either express or implied.',
      'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.',
      'Our total liability shall not exceed the amount paid by you for the service in the twelve months preceding the claim.',
    ],
  },
  {
    heading: '9. Indemnification',
    body: [
      'You agree to indemnify and hold harmless ShareLive, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the service or violation of these terms.',
    ],
  },
  {
    heading: '10. Governing Law',
    body: [
      'These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.',
      'Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.',
    ],
  },
  {
    heading: '11. Changes to Terms',
    body: [
      'We may update these Terms and Conditions from time to time. We will notify you of any changes by posting the new terms on this page.',
      'Your continued use of ShareLive after changes are posted constitutes acceptance of the revised terms.',
      'Last updated: December 1, 2025',
    ],
  },
  {
    heading: '12. Contact',
    body: [
      'For questions about these Terms, please contact us at 9chaitanyashinde@gmail.com or call 93739 54169.',
    ],
  },
];

const TermsPage = () => {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-16 md:px-10 lg:px-0">
      <header className="space-y-4 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Terms & Conditions</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Terms of Service for ShareLive
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Please read these terms carefully before using our subdomain routing services.
        </p>
      </header>
      <section className="space-y-10">
        {sections.map((section) => (
          <article
            key={section.heading}
            className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm"
          >
            <h2 className="text-xl font-medium text-foreground md:text-2xl">{section.heading}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground md:text-base">
              {section.body.map((paragraph) => (
                <li key={paragraph}>{paragraph}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
};

export default TermsPage;
