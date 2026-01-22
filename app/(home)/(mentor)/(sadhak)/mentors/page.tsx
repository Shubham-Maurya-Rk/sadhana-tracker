import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, ShieldCheck } from "lucide-react";

import { followUser, getMentors } from "@/app/actions/mentorship";
import { MentorSearch } from "./MentorSearch";
import { MentorshipActionButton } from "./MentorshipActionButton";
import Link from "next/link";
import { toast } from "sonner";
import { MentorIdDisplay } from "./MentorIdDisplay";

export default async function MentorsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q: query = "" } = await searchParams;
    const mentors = await getMentors(query);

    const myCounselors = mentors.filter(
        (m) => m.receivedMentorshipRequests.some(r => r.status === "ACCEPTED")
    );

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="flex flex-col gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Mentorship</h1>
                        <p className="text-xl text-muted-foreground">
                            Connect with experienced practitioners to guide your spiritual journey.
                        </p>
                    </div>

                    {/* Become a Mentor Info Section */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 max-w-2xl">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground/80">
                            Want to guide others? Go to your
                            <Link
                                href="/profile"
                                className="font-bold text-primary mx-1 hover:underline decoration-2 underline-offset-4 transition-all"
                            >
                                Profile Page
                            </Link>
                            and click <span className="italic text-primary font-semibold">"Become a mentor"</span> to start your journey.
                        </p>
                    </div>
                </div>

                <Card className="bg-muted/40 border-none shadow-none">
                    <CardContent className="p-4">
                        <MentorSearch />
                    </CardContent>
                </Card>

                <Tabs defaultValue="explore" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-muted w-full justify-start rounded-none mb-6">
                        <TabsTrigger value="my-mentors" className="relative data-[state=active]:bg-transparent shadow-none rounded-none pb-4">
                            My Counselors <Badge className="ml-2">{myCounselors.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="explore" className="relative data-[state=active]:bg-transparent shadow-none rounded-none pb-4">
                            Explore All
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-mentors">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myCounselors.length === 0 ? (
                                <EmptyState message="You don't have any active mentors yet." />
                            ) : (
                                myCounselors.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} />)
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="explore">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mentors.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} />)}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function MentorCard({ mentor }: { mentor: any }) {
    const isFollowing = mentor.followers.length > 0;
    const request = mentor.receivedMentorshipRequests[0];
    const isVerified = mentor.mentorApplication?.status === "APPROVED";

    const handleFollow = async () => { "use server"; await followUser(mentor.id); };

    // Optional: Helper function to copy ID to clipboard
    const copyId = () => {
        navigator.clipboard.writeText(mentor.id);
        toast.success("ID copied to clipboard");
    };

    return (
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-muted/60">
            <CardHeader className="flex flex-row items-start gap-4 pb-4">
                <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage src={mentor.profileImage || ""} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                            {mentor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-blue-600 fill-blue-50" />
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <CardTitle className="text-xl leading-tight">{mentor.name}</CardTitle>
                    <CardDescription className="flex flex-col gap-0.5">
                        <span>{mentor.templeName || "Independent Guide"}</span>
                        {/* Displaying the ID here in small, muted text */}
                        <MentorIdDisplay id={mentor.id} />
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <form action={handleFollow} className="flex-1">
                    <Button
                        variant={isFollowing ? "outline" : "secondary"}
                        disabled={isFollowing}
                        className="w-full h-10 gap-2 border-primary/20"
                    >
                        <BookOpen className="w-4 h-4" />
                        {isFollowing ? "Subscribed" : "Follow Stories"}
                    </Button>
                </form>

                <div className="flex-1">
                    <MentorshipActionButton
                        mentorId={mentor.id}
                        status={request?.status}
                        mentorName={mentor.name}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 bg-muted/10 rounded-2xl border-2 border-dashed">
            <Search className="w-8 h-8 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center font-medium">{message}</p>
        </div>
    );
}