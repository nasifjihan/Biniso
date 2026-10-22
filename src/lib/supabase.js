import { createClient } from "@supabase/supabase-js";

// Public, read-only Supabase client used by server components to fetch the
// catalog. Responses are cached and tagged "products" so that admin edits can
// invalidate them with revalidateTag("products").
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 300, tags: ["products"] } }),
    },
  },
);
