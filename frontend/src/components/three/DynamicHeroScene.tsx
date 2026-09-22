'use client';

import dynamic from 'next/dynamic';

const HeroScene = dynamic(() => import('./HeroScene').then((mod) => mod.HeroScene), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

export default function DynamicHeroScene() {
  return <HeroScene />;
}
