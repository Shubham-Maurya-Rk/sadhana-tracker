import { getAllUsers } from "@/app/actions/user";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Search, Users, ShieldCheck, Flame } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
    const { success, data: users, error } = await getAllUsers();

    if (!success) {
        return (
            <div className="container py-10">
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>System Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        Sadhak <span className="text-orange-600 dark:text-orange-500">Management</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Overseeing {users.length} practitioners in the community.
                    </p>
                </div>

                {/* Quick Search UI (Visual only for now) */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9 bg-background/50 backdrop-blur-sm border-orange-100 dark:border-orange-950"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600">Active Sadhaks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                {/* You can add more stat cards here for high streaks, etc. */}
            </div>

            {/* Main Table Card */}
            <Card className="shadow-xl border-none bg-card/60 backdrop-blur-md">
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Practitioner Directory
                    </CardTitle>
                    <CardDescription>
                        Manage credentials and view current spiritual consistency.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="py-4 pl-6">Profile</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Spirituality</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead className="text-right pr-6">Security</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-orange-50/30 dark:hover:bg-orange-950/5 transition-all">
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm group-hover:scale-105 transition-transform">
                                                    <AvatarImage src={user.profileImage || ""} />
                                                    <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 font-bold">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm leading-none">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.role === "SUPERADMIN" ? "default" : "secondary"}
                                                className={`capitalize px-2.5 py-0.5 rounded-full font-medium ${user.role === "SUPERADMIN"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {user.role.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center bg-orange-100 dark:bg-orange-950/40 px-2 py-1 rounded-md">
                                                    <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{user.currentStreak}</span>
                                                    <Flame className="h-3.5 w-3.5 ml-1 text-orange-500 fill-orange-500" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">
                                            {user.phoneNumber || "—"}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <ResetPasswordDialog userId={user.id} userName={user.name} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}