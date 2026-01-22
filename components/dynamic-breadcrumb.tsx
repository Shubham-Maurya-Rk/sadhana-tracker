"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export function DynamicBreadcrumb() {
    const pathname = usePathname();

    // Split the path into segments and filter out empty strings
    const pathSegments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {/* Always show Home icon/link first */}
                <BreadcrumbItem>
                    <BreadcrumbLink href="/" className="flex items-center gap-1">
                        <Home size={14} />
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {pathSegments.length > 0 && <BreadcrumbSeparator />}

                {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathSegments.length - 1;

                    // Format the segment: "book-reading" -> "Book Reading"
                    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-bold text-foreground">
                                        {title}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}