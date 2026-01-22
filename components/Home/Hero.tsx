// components/hero.tsx
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        // 1. Ensure absolute positioning covers the parent
        // 2. Use min-w-full and min-h-full to force coverage
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover z-0"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>


      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-stone-50/70 dark:bg-stone-950/70 z-10" />

      {/* Content Container */}
      <div className="relative z-20 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Elevate Your Daily <span className="text-orange-600">Sadhana</span>
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground mb-10">
          The complete tracking system for devotees. Manage your rounds, reading,
          and morning programs with ease and accountability.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" passHref>
            <Button size="lg" variant="orange" className="h-10 px-8 cursor-pointer group">
              Start Your Practice
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/#sadhana-motivation" scroll={true}>
            <Button size="lg" variant="outline" className="h-10 px-8 cursor-pointer hover:bg-zinc-50 transition-colors">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}