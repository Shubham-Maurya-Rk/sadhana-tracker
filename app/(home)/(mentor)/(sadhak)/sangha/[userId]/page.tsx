import { getDetailedSadhakaData } from "@/app/actions/friend";
import SadhanaView from "@/components/SadhanaView";
import { ShieldAlert, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProfilePage({
    params
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId } = await params;
    const res = await getDetailedSadhakaData(userId);
    console.log(res);

    if (res.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
                <div className="relative mb-6">
                    <div className="w-24 h-24 bg-muted rounded-[2.5rem] flex items-center justify-center">
                        <Lock className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-destructive p-2 rounded-full border-4 border-background">
                        <ShieldAlert size={20} className="text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Private Sadhana</h2>
                <p className="text-muted-foreground mt-2 max-w-xs font-bold italic">
                    You must be tracking this Sadhaka to view their detailed logs and progress.
                </p>
                <div className="mt-8 flex gap-4">
                    <Link href="/friends">
                        <Button variant="outline" className="rounded-2xl font-black px-6">GO BACK</Button>
                    </Link>
                    <Button className="rounded-2xl font-black px-6 gap-2">
                        <UserPlus size={18} /> SEND REQUEST
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-4xl mx-auto pb-20">
            <SadhanaView user={res.data} />
        </main>
    );
}