import LandingClient from './landing-client';
import { JsonLd } from '@/components/seo/json-ld';
import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from '@/lib/seo-schemas';

export default function LandingPage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={softwareApplicationSchema} />
      <LandingClient />
    </>
  );
}
