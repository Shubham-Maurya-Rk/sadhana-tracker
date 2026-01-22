import { getInspirations } from "@/app/actions/inspiration";
import { AddShloka } from "./AddShloka";
import { InspirationFilters } from "@/app/(home)/admin/motivations/MotivationFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Link as LinkIcon } from "lucide-react";
import { DeleteMotivationBtn } from "@/app/(home)/admin/motivations/DeleteMotivationBtn";

// Shloka specific types
const SHLOKA_TYPES = ["GITA", "BHAGAVATAM", "CHAITANYA", "OTHERS"];

export default async function ShlokaAdminPage(props: {
    searchParams: Promise<{ q?: string; type?: string }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams.q || "";
    const typeFilter = searchParams.type || "ALL";

    // Fetching SHLOKA category
    const { data: shlokas } = await getInspirations("SHLOKA", query, typeFilter);

    return (
        // Using w-full and max-w-none to ensure full-width layout
        <div className="p-8 w-full space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        Shlokas <Book className="text-primary" size={32} />
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Automatic daily rotation active ({shlokas?.length || 0} in pool).
                    </p>
                </div>
                <AddShloka />
            </div>

            {/* Filters - Reusing Motivation filters with Shloka types */}
            <InspirationFilters 
                currentType={typeFilter} 
                currentQuery={query} 
                types={SHLOKA_TYPES} 
            />

            {/* List Section */}
            <div className="grid gap-4 w-full">
                {!shlokas || shlokas.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed rounded-[2rem] bg-muted/10">
                        <p className="text-muted-foreground font-bold text-lg">No shlokas found.</p>
                    </div>
                ) : (
                    shlokas.map((item) => (
                        <Card key={item.id} className="border-none shadow-sm rounded-2xl bg-card group overflow-hidden w-full">
                            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-3 w-full">
                                    <div className="flex items-center gap-2">
                                        <Badge className="font-bold text-[10px] uppercase tracking-wider">
                                            {item.type}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            ID: {item.id.slice(-6)}
                                        </span>
                                    </div>
                                    
                                    {/* Shloka Text with preserved line breaks */}
                                    <p className="font-medium text-foreground leading-relaxed italic whitespace-pre-line">
                                        "{item.text}"
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-2">
                                        <span className="text-primary">— {item.author}</span>
                                        {item.reference && <span>Ref: {item.reference}</span>}
                                    </div>
                                </div>

                                {/* Action Buttons Area */}
                                <div className="flex items-center gap-1 shrink-0 self-center md:self-start">
                                    {item.sourceLink && (
                                        <a
                                            href={item.sourceLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                                            title="Visit Source"
                                        >
                                            <LinkIcon size={18} />
                                        </a>
                                    )}
                                    <DeleteMotivationBtn id={item.id} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}