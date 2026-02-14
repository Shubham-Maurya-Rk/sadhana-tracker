"use client";

import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function AppleCardsCarousel({ id }: { id: string }) {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <div className="w-full max-w-full relative overflow-hidden sm:pb-20 md:py-20" id={id}>
      <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
        Web App Screenshots
      </h2>
      <Carousel items={cards} />
    </div>
  );
}

const DummyContent = () => {
  return (
    <>
      {[...new Array(3).fill(1)].map((_, index) => {
        return (
          <div
            key={"dummy-content" + index}
            className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
          >
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
              <span className="font-bold text-neutral-700 dark:text-neutral-200">
                The first rule of Apple club is that you boast about Apple club.
              </span>{" "}
              Keep a journal, quickly jot down a grocery list, and take amazing
              class notes. Want to convert those notes to text? No problem.
              Langotiya jeetu ka mara hua yaar is ready to capture every
              thought.
            </p>
            <img
              src="https://assets.aceternity.com/macbook.png"
              alt="Macbook mockup from Aceternity UI"
              height="500"
              width="500"
              className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
            />
          </div>
        );
      })}
    </>
  );
};

const data = [
  {
    category: "",
    title: "",
    src: "/images/slider/sadhana.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/sadhana-2.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/book_tracking.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/challenges.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/sangha.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/frineds-profile.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/mentors.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/chats.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/groups.png",
    content: <DummyContent />,
  },
  {
    category: "",
    title: "",
    src: "/images/slider/members-profile.png",
    content: <DummyContent />,
  },

];
