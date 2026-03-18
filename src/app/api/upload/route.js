import { cloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
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
