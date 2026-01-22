import { Hero } from "@/components/Home/Hero"
import { AppleCardsCarousel } from "@/components/Home/apple-card-carousel"
import { InspirationSection } from "@/components/Home/motivation";
import { FocusCardsDemo } from "@/components/Home/focus-card";

export default function Home() {
  return (
    /* FIX: overflow-x-hidden on the main container prevents 
      any child components (like Hero blobs or Carousels) 
      from pushing the page width beyond 100vw.
    */
    <main className="relative w-full overflow-x-hidden">
      <Hero />

      {/* Ensure sections have consistent padding for mobile 
        to prevent text from touching the screen edges.
      */}
      <div className="flex flex-col">

        <InspirationSection
          id="sadhana-motivation"
          category="MOTIVATION"
          title="Daily Motivation"
        />

        {/* Carousels are the most common cause of horizontal scroll.
          Wrapping it in a div with overflow control helps.
        */}
        <div className="w-full overflow-hidden">
          <AppleCardsCarousel id="about-app" />
        </div>

        <InspirationSection
          id="daily-shlokas"
          category="SHLOKA"
          title="Verse of the Day"
        />

      </div>
    </main>
  );
}