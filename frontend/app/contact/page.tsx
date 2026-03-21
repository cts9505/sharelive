import type { Metadata } from 'next';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the ShareLive team for support, partnerships, or general inquiries.',
};

const ContactPage = () => {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16 md:px-10 lg:px-0">
      <header className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Get in touch
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
          Have questions, feedback, or need help? We'd love to hear from you. Reach out via the
          form below or use our contact details.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Contact Form */}
        <section className="rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm md:p-8">
          <form className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="partnership">Partnership</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="How can we help you?"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Send className="h-4 w-4" />
              Send message
            </button>
          </form>
        </section>

        {/* Contact Details */}
        <section className="flex flex-col justify-between gap-8">
          <div className="space-y-8">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Email</h3>
                  <a
                    href="mailto:9chaitanyashinde@gmail.com"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    9chaitanyashinde@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Phone</h3>
                  <a
                    href="tel:9373954169"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    +91 93739 54169
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Address</h3>
                  <p className="text-sm text-muted-foreground">Pradhikaran
                    Pune 411044,<br /> Maharashtra, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="mb-2 font-medium text-foreground">Response Time</h3>
            <p className="text-sm text-muted-foreground">
              We typically respond within 24–48 hours on business days. For urgent issues, please
              call us directly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ContactPage;
