import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellations & Refund Policy',
  description:
    'Learn about ShareLive cancellation and refund policies for paid subscriptions.',
};

const sections = [
  {
    heading: '1. Overview',
    body: [
      'This Cancellation and Refund Policy explains when and how you can cancel your ShareLive subscription and request a refund.',
      'By subscribing to a paid ShareLive plan, you agree to this policy.',
    ],
  },
  {
    heading: '2. Free Tier',
    body: [
      'The ShareLive free tier requires no payment and can be used indefinitely.',
      'There is nothing to cancel or refund for free tier users.',
    ],
  },
  {
    heading: '3. Paid Subscriptions',
    body: [
      'Paid plans are billed monthly or annually, depending on your chosen billing cycle.',
      'You may cancel your subscription at any time from your dashboard.',
      'Upon cancellation, your subscription remains active until the end of the current billing period.',
    ],
  },
  {
    heading: '4. Refund Eligibility',
    body: [
      '7-Day Money-Back Guarantee: If you are not satisfied with a paid plan, you may request a full refund within 7 days of your initial purchase or upgrade.',
      'Refunds are not available after the 7-day period.',
      'Refunds are only applicable to the most recent payment and do not cover prior billing cycles.',
    ],
  },
  {
    heading: '5. How to Request a Refund',
    body: [
      'To request a refund, email us at 9chaitanyashinde@gmail.com with your account email and reason for the refund.',
      'Refund requests are typically processed within 5–10 business days.',
      'Approved refunds will be credited to your original payment method.',
    ],
  },
  {
    heading: '6. Non-Refundable Items',
    body: [
      'Refunds are not available for accounts terminated due to violation of our Terms of Service.',
      'Partial refunds are not provided for unused portions of a billing period after the 7-day window.',
    ],
  },
  {
    heading: '7. Downgrading Plans',
    body: [
      'You may downgrade from a paid plan to the free tier at any time.',
      'Downgrading takes effect at the end of your current billing period.',
      'Any premium features will be removed once the downgrade is active.',
    ],
  },
  {
    heading: '8. Contact Us',
    body: [
      'If you have any questions about cancellations or refunds, please contact us:',
      'Email: 9chaitanyashinde@gmail.com',
      'Phone: 93739 54169',
      'Address: Pune, Maharashtra, India',
    ],
  },
  {
    heading: '9. Policy Updates',
    body: [
      'We may update this policy from time to time. Changes will be posted on this page with a revised date.',
      'Last updated: December 1, 2025',
    ],
  },
];

const RefundPolicyPage = () => {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-16 md:px-10 lg:px-0">
      <header className="space-y-4 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Refund Policy</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Cancellations & Refunds
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Understand how cancellations and refunds work for ShareLive paid subscriptions.
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

export default RefundPolicyPage;
