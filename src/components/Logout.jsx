"use client";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
      }}
    >
      Logout
    </Button>
  );
}
