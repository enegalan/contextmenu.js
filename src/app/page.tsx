import { Hero } from "@/components/home/hero";
import { LiveDemo } from "@/components/home/live-demo";
import { FeatureCards } from "@/components/home/feature-cards";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <LiveDemo />
      <FeatureCards />
    </main>
  );
}
