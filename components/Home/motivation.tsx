import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { getDailyItemByType } from "@/app/actions/inspiration";
import { InspirationCategory, InspirationType } from "@/generated/prisma/client";

interface Props {
    id: string;
    category: InspirationCategory;
    title: string;
}

export async function InspirationSection({ id, category, title }: Props) {
    // Define which types belong to which section
    const typesToFetch: InspirationType[] = category === "SHLOKA"
        ? ["GITA", "BHAGAVATAM", "CHAITANYA", "OTHERS"]
        : ["JAPA", "LECTURE", "BOOK", "OTHERS"];

    // Fetch daily content for all types in parallel
    const results = await Promise.all(
        typesToFetch.map(type => getDailyItemByType(category, type))
    );

    // Filter out nulls (types that don't have data yet)
    const validData = results.filter((item): item is NonNullable<typeof item> => item !== null);

    if (validData.length === 0) return null;

    // Custom images per type to make the carousel look beautiful
    const images: Record<string, string> = {
        JAPA: "/images/japa.png", // Beads
        LECTURE: "/images/reading.jpg", // Mic/speaker
        BOOK: "/images/reading.jpg", // Reading
        GITA: "/images/bg.jpg", // Sacred Text
        BHAGAVATAM: "/images/sb.png", // Ancient art
        CHAITANYA: "/images/cc.jpg", // Devotional
        OTHERS: "/images/others.jpg",
    };

    const testimonialData = validData.map(item => ({
        quote: item.text,
        name: item.type.replace(/_/g, " "), // Clean up enum names
        designation: item.reference || item.author,
        src: images[item.type] || images.OTHERS,
        sourceLink: item.sourceLink,
    }));

    return (
        <section className="w-full relative pt-20" id={id}>
            {/* 1. Added relative z-10 to ensure it stays above any animation overflows */}
            <div className="max-w-7xl mx-auto px-8 mb-12 relative z-10">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white border-l-8 border-orange-600 pl-6 uppercase">
                    {title}
                </h2>
            </div>

            {/* 2. Added a wrapper to control the component height/spacing */}
            <div className="relative">
                <AnimatedTestimonials testimonials={testimonialData} autoplay={true} />
            </div>
        </section>
    );
}