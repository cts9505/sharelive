import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | ShareLive',
  description: 'How ShareLive collects, uses, and protects your data.',
};

const sections = [
  {
    heading: '1. Overview',
    body: [
      'ShareLive connects your existing deployments to branded subdomains. We only collect the information required to provide and improve this service.',
      'By using ShareLive, you consent to the practices described in this Privacy Policy.',
    ],
  },
  {
    heading: '2. Information We Collect',
    body: [
      'Account Data: Name, email address, and authentication details you supply when creating or managing an account.',
      'Usage Data: Logs related to subdomain provisioning, API activity, and security events. This information helps us deliver reliable routing and mitigate abuse.',
      'Support Data: Any additional details you choose to provide when contacting us for help or feedback.',
    ],
  },
  {
    heading: '3. How We Use Information',
    body: [
      'Provide Services: Authenticate users, issue subdomains, and maintain DNS or proxy functionality.',
      'Improve Platform: Analyze anonymized usage trends to enhance performance, stability, and user experience.',
      'Communicate: Send essential updates, respond to support requests, and share product news with your consent.',
    ],
  },
  {
    heading: '4. Data Sharing & Disclosure',
    body: [
      'We do not sell your data. We only share information with trusted providers (for example, email delivery, analytics, or infrastructure partners) required to operate ShareLive.',
      'Service providers are contractually obligated to protect the information we share with them.',
      'We may disclose data if required by law or to defend our rights, users, or the public.',
    ],
  },
  {
    heading: '5. Security',
    body: [
      'We apply industry-standard safeguards, including encryption in transit, role-based access, and monitoring. No system is perfect, so we encourage responsible disclosure of any vulnerabilities you discover.',
    ],
  },
  {
    heading: '6. Data Retention',
    body: [
      'We retain personal information only as long as it is necessary to deliver the service or comply with legal obligations. You can request deletion of your account by contacting support.',
    ],
  },
  {
    heading: '7. Your Rights',
    body: [
      'Access and Update: Review or correct the information associated with your account.',
      'Erase: Request deletion of personal data where permitted by law.',
      'Opt Out: Unsubscribe from marketing messages at any time using the link provided in our emails.',
    ],
  },
  {
    heading: '8. International Data Transfers',
    body: [
      'ShareLive may process and store data in multiple regions. We ensure appropriate safeguards are in place when data is transferred across borders.',
    ],
  },
  {
    heading: '9. Contact Us',
    body: [
      'If you have questions about this policy or your data, contact us at 9chaitanyashinde@gmail.com or call 93739 54169.',
    ],
  },
  {
    heading: '10. Updates to This Policy',
    body: [
      'We may update this Privacy Policy to reflect new features, legal requirements, or best practices. When we make material changes, we will notify you via email or an in-app announcement.',
      'Last updated: December 1, 2025',
    ],
  },
];

const PrivacyPolicyPage = () => {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-16 md:px-10 lg:px-0">
      <header className="space-y-4 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Privacy Policy</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">How we protect your data at ShareLive</h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Transparency is built into ShareLive. This page outlines what information we collect, why we collect it, and how you stay in control of your data.
        </p>
      </header>
      <section className="space-y-10">
        {sections.map((section) => (
          <article key={section.heading} className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm">
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

export default PrivacyPolicyPage;
