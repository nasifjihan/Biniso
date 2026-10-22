import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLE, CUSTOMER_ROLE, isAdminRole } from "@/lib/roles";

// `auth.users` is not exposed over PostgREST, so the list has to come from the
// Auth admin API, which requires the service-role key. Server-only: never
// import this from a Client Component.
export async function listAdminUsers() {
  const supabase = createSupabaseAdminClient();

  // One page is enough for a store with a few staff accounts; anything past the
  // cap would need paging here and in the UI.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) throw error;

  const users = (data?.users || []).map((user) => ({
    id: user.id,
    email: user.email || "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    confirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
    role: isAdminRole(user.app_metadata?.role) ? ADMIN_ROLE : CUSTOMER_ROLE,
  }));

  // Newest first, and admins on top so the ones that matter are easy to find.
  users.sort((a, b) => {
    if (a.role !== b.role) return a.role === ADMIN_ROLE ? -1 : 1;
    return String(b.created_at).localeCompare(String(a.created_at));
  });

  return users;
}
