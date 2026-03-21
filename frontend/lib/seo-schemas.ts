export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ShareLive',
  url: 'https://sharelive.me',
  logo: 'https://sharelive.me/logo.png',
  description:
    'Tunnel localhost to the internet with ShareLive, then route deployed apps with branded subdomains from the dashboard.',
  founder: {
    '@type': 'Person',
    name: 'Chaitanya Shinde',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Nav Shanti Niketan Housing Society, Plot C-39, Sector 29, Pradhikaran',
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    postalCode: '411044',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9373954169',
    contactType: 'customer service',
    email: '9chaitanyashinde@gmail.com',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: [],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ShareLive',
  url: 'https://sharelive.me',
  description: 'Tunnel localhost and route deployed apps',
  publisher: {
    '@type': 'Organization',
    name: 'ShareLive',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://sharelive.me/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ShareLive',
  operatingSystem: 'Web',
  applicationCategory: 'DeveloperApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  description:
    'Tunnel localhost to the internet with ShareLive, then route deployed apps with branded subdomains from the dashboard.',
  featureList: [
    'Localhost to internet tunneling',
    'CLI-based tunnel workflow',
    'Instant subdomain provisioning',
    'Proxy routing',
    'Custom DNS support',
    'SSL certificates included',
    'Dashboard management',
  ],
};
