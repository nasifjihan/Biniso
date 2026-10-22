import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { listAdminUsers } from "@/lib/adminUsers";
import AdminUsers from "@/components/Admin/AdminUsers";

export const metadata = { title: "Admin users" };

export default async function AdminUsersPage() {
  // middleware.js already blocks non-admins; this covers a session that changed
  // between that check and this render, and tells the list who "you" are.
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  const users = await listAdminUsers();

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Admin users</h1>
      <AdminUsers users={users} currentUserId={admin.id} />
    </div>
  );
}
