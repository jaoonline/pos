import { requireUserForPage } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await requireUserForPage();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">View your account details and change your password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full name</span>
            <span className="font-medium">{user.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">
              {user.role === "ADMINISTRATOR" ? "Administrator" : "Salesperson"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
