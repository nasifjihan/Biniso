// Role names shared by the server code that sets them and the client UI that
// shows them. Deliberately free of imports so a Client Component can use it
// without pulling a server-only Supabase client into the browser bundle.
//
// The value lives in `app_metadata`, which only the server can write, so a
// signed-in user cannot promote themselves by editing their profile.

export const ADMIN_ROLE = "admin";
export const CUSTOMER_ROLE = "customer";

export const ROLE_LABELS = {
  [ADMIN_ROLE]: "Admin",
  [CUSTOMER_ROLE]: "Customer",
};

export function isAdminRole(role) {
  return role === ADMIN_ROLE;
}
