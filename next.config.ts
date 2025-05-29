
import type {NextConfig} from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

// VAŽNO: Promijenite ovu vrijednost ako je naziv vašeg GitHub repozitorijuma drugačiji!
const repoName = 'naslednici'; // <<< PROMIJENJENO OVDJE

const nextConfig: NextConfig = {
  output: 'export', // Omogućava statički HTML eksport
  // basePath će biti `/${repoName}` (npr. /naslednici) u produkciji,
  // a prazan string u razvoju. Ovo je ključno za GitHub Pages.
  basePath: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',
  // assetPrefix osigurava da se statički resursi (CSS, JS, slike) učitavaju sa ispravne putanje u produkciji.
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
     unoptimized: true, // Potrebno za statički eksport sa next/image
  },
};

export default withPWA(nextConfig);
