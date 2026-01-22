import GroupManagementClient from "./Groups";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getMentorGroups } from "@/app/actions/group";

export default async function GroupsPage() {
  const { data: groups = [], error } = await getMentorGroups();

  // 1. Handle Authentication/Fetch Errors
  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <GroupManagementClient initialGroups={groups} />
    </div>
  );
}