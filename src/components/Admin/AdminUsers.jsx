"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/actions/setUserRole";
import { createAdminUser } from "@/app/actions/createAdminUser";
import { ADMIN_ROLE, CUSTOMER_ROLE, ROLE_LABELS } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsers({ users, currentUserId }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const adminCount = users.filter((u) => u.role === ADMIN_ROLE).length;
  // The last admin cannot be demoted, otherwise nobody could administer the
  // store. Changing your own role is refused by the action as well.
  const lockedRole = adminCount <= 1;

  function changeRole(user, role) {
    startTransition(async () => {
      const res = await setUserRole(user.id, role);
      if (!res?.ok) {
        toast.error(res?.error || "Failed to change the role");
        return;
      }
      toast.success(
        `${res.email || "That user"} is now ${ROLE_LABELS[role].toLowerCase()}`,
      );
      router.refresh();
    });
  }

  function handleCreate(e) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const res = await createAdminUser(form);
      if (!res?.ok) {
        setError(res?.error || "Failed to create the admin");
        return;
      }
      setForm({ email: "", password: "" });
      toast.success(`${res.email} can now sign in as an admin`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last sign-in</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isAdmin = user.role === ADMIN_ROLE;
                  const isSelf = user.id === currentUserId;
                  const locked = isSelf || (isAdmin && lockedRole);

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email}
                        {isSelf && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAdmin ? "default" : "secondary"}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.confirmed ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending || locked}
                            title={
                              isSelf
                                ? "You cannot change your own role"
                                : lockedRole
                                  ? "The store needs at least one admin"
                                  : undefined
                            }
                            onClick={() => changeRole(user, CUSTOMER_ROLE)}
                          >
                            Make customer
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => changeRole(user, ADMIN_ROLE)}
                          >
                            Make admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl max-w-xl">
        <CardHeader>
          <CardTitle>Add an admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((current) => ({ ...current, email: e.target.value }))
                }
                placeholder="staff@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    password: e.target.value,
                  }))
                }
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                The account works straight away — share this password with them
                over a safe channel.
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
