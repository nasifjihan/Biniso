import { cloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Admin-only upload. The middleware guard covers `/admin/*`, not `/api/*`, so
// the route checks the session itself — without this it is an open proxy onto
// the Cloudinary account and anyone can spend the quota.
export async function POST(request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.formData();
  const file = data.get("file");

  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "Biniso/products" }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      })
      .end(buffer);
  });

  return NextResponse.json({ url: upload.secure_url });
}
