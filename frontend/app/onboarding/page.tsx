'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type OnboardingStep = 'welcome' | 'profile' | 'contact' | 'address' | 'business' | 'preferences';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    occupation: '',
    companyName: '',
    gstin: '',
    newsletterSubscribed: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (step === 'preferences') {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/users/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          
          // Handle validation errors from Zod
          if (error.details && Array.isArray(error.details)) {
            const messages = error.details.map((detail: any) => detail.message).join('. ');
            throw new Error(messages);
          }
          
          throw new Error(error.error || 'Failed to complete onboarding');
        }

        toast.success('Profile completed successfully!');
        router.push('/dashboard');
      } catch (error) {
        toast.error('Failed to save profile. Please try again.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      // Move to next step
      const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'contact', 'address', 'business', 'preferences'];
      const currentIndex = stepOrder.indexOf(step);
      if (currentIndex < stepOrder.length - 1) {
        setStep(stepOrder[currentIndex + 1]);
      }
    }
  };

  const goBack = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'contact', 'address', 'business', 'preferences'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const skipStep = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'contact', 'address', 'business', 'preferences'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {['welcome', 'profile', 'contact', 'address', 'business', 'preferences'].indexOf(step) + 1} of 6</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((['welcome', 'profile', 'contact', 'address', 'business', 'preferences'].indexOf(step) + 1) / 6) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((['welcome', 'profile', 'contact', 'address', 'business', 'preferences'].indexOf(step) + 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to ShareLive!</h1>
            <p className="text-muted-foreground mb-8">
              Let's set up your profile. This will only take a few minutes.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              You can skip optional steps now and complete them later when creating a subdomain.
            </p>
            <button
              onClick={() => setStep('profile')}
              className="w-full rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Profile Step */}
        {step === 'profile' && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Basic Information</h2>
            <p className="text-muted-foreground mb-6">Tell us a bit about yourself</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-muted-foreground text-xs">(from your account)</span>
                </label>
                <input
                  disabled
                  type="email"
                  value={session?.user?.email ?? ''}
                  className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-muted-foreground outline-none cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll send a verification email after onboarding
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-full border border-border px-6 py-3 text-foreground hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Contact Step */}
        {step === 'contact' && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Contact Information</h2>
            <p className="text-muted-foreground mb-6">
              Phone verification required for creating subdomains
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-muted-foreground text-xs">(Optional now, required later)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll send an OTP to verify your phone when you create your first subdomain
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-full border border-border px-6 py-3 text-foreground hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={skipStep}
                className="flex-1 rounded-full border border-border px-6 py-3 text-muted-foreground hover:bg-accent transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Address Step */}
        {step === 'address' && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Address Details</h2>
            <p className="text-muted-foreground mb-6">Optional - Can be added later</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => updateField('addressLine1', e.target.value)}
                  placeholder="Street address, P.O. box"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => updateField('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Mumbai"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="400001"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-full border border-border px-6 py-3 text-foreground hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={skipStep}
                className="flex-1 rounded-full border border-border px-6 py-3 text-muted-foreground hover:bg-accent transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Business Step */}
        {step === 'business' && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Business Information</h2>
            <p className="text-muted-foreground mb-6">Optional - Helpful for billing and invoices</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  placeholder="Developer, Designer, Student, etc."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Your company or organization"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  GSTIN <span className="text-muted-foreground text-xs">(For Indian businesses)</span>
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  GST Number for invoicing and tax purposes
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-full border border-border px-6 py-3 text-foreground hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={skipStep}
                className="flex-1 rounded-full border border-border px-6 py-3 text-muted-foreground hover:bg-accent transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Preferences Step */}
        {step === 'preferences' && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Your Preferences</h2>
            <p className="text-muted-foreground mb-6">Almost done! Just a few more details</p>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-accent cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.newsletterSubscribed}
                  onChange={(e) => updateField('newsletterSubscribed', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                />
                <div>
                  <div className="font-medium text-foreground">Subscribe to newsletter</div>
                  <div className="text-sm text-muted-foreground">
                    Get updates about new features, tips, and exclusive offers
                  </div>
                </div>
              </label>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-foreground">
                    <strong>Note:</strong> To create a subdomain, you'll need to verify your phone number and email address. You can do this later from your profile settings.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex-1 rounded-full border border-border px-6 py-3 text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
