"use client";

import { useState } from "react";
import { adminResetUserPassword } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    KeyRound,
    Copy,
    Check,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordDialogProps {
    userId: string;
    userName: string;
}

export function ResetPasswordDialog({ userId, userName }: ResetPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [copied, setCopied] = useState(false);

    // Function to copy the password to clipboard so you can send it to the user
    const handleCopy = async () => {
        if (!password) return;
        await navigator.clipboard.writeText(password);
        setCopied(true);
        toast.success("Password copied! You can now paste it to the user.");
        setTimeout(() => setCopied(false), 2000);
    };

    // Function to call the Server Action
    const onReset = async () => {
        if (password.length < 6) {
            return toast.error("Password must be at least 6 characters long.");
        }

        setIsPending(true);
        try {
            const result = await adminResetUserPassword(userId, password);

            if (result.success) {
                toast.success(`Password for ${userName} has been updated.`);
                setOpen(false);
                setPassword("");
            } else {
                toast.error(result.error || "Failed to reset password.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset Password
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-orange-600" />
                        Manual Reset: {userName}
                    </DialogTitle>
                    <DialogDescription>
                        This will immediately change the password in the database.
                        Ensure you share this new password with the Sadhak.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New temporary password..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={handleCopy}
                            disabled={!password}
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={onReset}
                            disabled={isPending || password.length < 6}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating Database...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}