"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";

export function MentorSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Initial value from URL (e.g., if user refreshes page)
    const initialQuery = searchParams.get("q") || "";
    const [value, setValue] = useState(initialQuery);

    // Safety Ref: Prevents the "searching again and again" loop
    const lastSearchedValue = useRef(initialQuery);

    useEffect(() => {
        // PROTECTION: If the user hasn't typed anything new, stop here.
        if (value === lastSearchedValue.current) return;

        const timeout = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            if (value) {
                params.set("q", value);
            } else {
                params.delete("q");
            }

            // Sync the ref before navigation
            lastSearchedValue.current = value;

            startTransition(() => {
                // { scroll: false } prevents the page from jumping to top
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            });
        }, 500); // 500ms debounce is optimal for server protection

        return () => clearTimeout(timeout);
    }, [value, pathname, router]);

    // Handle external changes (like Back Button or Clear)
    useEffect(() => {
        const currentQuery = searchParams.get("q") || "";
        if (currentQuery !== value) {
            setValue(currentQuery);
            lastSearchedValue.current = currentQuery;
        }
    }, [searchParams]);

    return (
        <div className="relative flex-1 max-w-full">
            <Search className={`absolute left-2.5 top-2.5 h-4 w-4 transition-colors ${isPending ? 'text-primary' : 'text-muted-foreground'}`} />
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search by name, temple, or ID..."
                className="pl-8 bg-background border-muted-foreground/20 focus-visible:ring-primary"
            />
            <div className="absolute right-2.5 top-2.5 flex items-center gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {value && !isPending && (
                    <button
                        onClick={() => setValue("")}
                        type="button"
                        className="p-0.5 hover:bg-muted rounded-md transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                )}
            </div>
        </div>
    );
}