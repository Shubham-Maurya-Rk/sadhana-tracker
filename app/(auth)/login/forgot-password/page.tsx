"use client"
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail } from "lucide-react";

export default function ForgotPasswordRequest() {
    return (
        <div className="text-center space-y-4 p-6 border rounded-2xl bg-muted/30">
            <h3 className="font-bold text-lg">Forgot Password?</h3>
            <p className="text-sm text-muted-foreground">
                Since our community is private, please contact your mentor or the admin to reset your password.
            </p>

            <div className="flex flex-col gap-2">
                {/* Replace with your actual contact details */}
                <Button variant="outline" className="gap-2" onClick={() => window.open('https://wa.me/yournumber')}>
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    Message Admin on WhatsApp
                </Button>

                <Button variant="ghost" className="text-xs">
                    admin@sadhakapp.com
                </Button>
            </div>
        </div>
    );
}