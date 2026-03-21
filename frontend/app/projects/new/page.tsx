import type { Metadata } from 'next';
import { CreateProjectForm } from '../../../components/create-project-form';
import RotatingEarth from '../../../components/ui/wireframe-dotted-globe';

export const metadata: Metadata = {
  title: 'Create Subdomain',
  description: 'Connect your deployment to a branded ShareLive subdomain in seconds. Free proxy routing included.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ subdomain?: string }>;
}

export default async function NewProjectPage({ searchParams }: PageProps) {
  const { subdomain } = await searchParams;
  
  // Validate subdomain from URL - only allow safe characters
  const safeSubdomain = subdomain && /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/i.test(subdomain)
    ? subdomain.toLowerCase()
    : undefined;

  return (
    <main className="px-4 py-8 md:px-8 md:py-12 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-[1fr,auto] gap-8 lg:gap-12 items-start">
        <div className="w-full max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">Create</p>
          <h1 className="text-3xl font-semibold mb-2">
            {safeSubdomain ? `Claim "${safeSubdomain}"` : 'Connect your deployment'}
          </h1>
          <p className="text-muted-foreground mb-10">
            {safeSubdomain 
              ? `The subdomain "${safeSubdomain}.sharelive.site" is available! Claim it now.`
              : "Free tier uses ShareLive's proxy routing. Upgrade anytime for direct DNS."
            }
          </p>
          <CreateProjectForm initialSubdomain={safeSubdomain} />
        </div>

        <div className="hidden lg:block">
          <RotatingEarth width={600} height={600} />
        </div>
      </div>
    </main>
  );
}

