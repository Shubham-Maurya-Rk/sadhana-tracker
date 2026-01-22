"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

interface FilterProps {
    currentType: string;
    currentQuery: string;
    types: string[]; // Pass types as a prop
}

export function InspirationFilters({ currentType, currentQuery, types }: FilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [text, setText] = useState(currentQuery);
    const debouncedSearch = useDebounce(text, 500);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (debouncedSearch) params.set("q", debouncedSearch);
        else params.delete("q");

        if (currentType && currentType !== "ALL") params.set("type", currentType);

        router.push(`${pathname}?${params.toString()}`);
    }, [debouncedSearch, router, pathname]);

    const handleTypeChange = (val: string) => {
        const params = new URLSearchParams(window.location.search);
        if (val !== "ALL") params.set("type", val);
        else params.delete("type");
        if (text) params.set("q", text);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search text..."
                    className="pl-9 rounded-xl h-11 border-none bg-card shadow-sm"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>

            <Select defaultValue={currentType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full md:w-[200px] rounded-xl h-11 border-none bg-card shadow-sm font-bold">
                    <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Sources</SelectItem>
                    {types.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}