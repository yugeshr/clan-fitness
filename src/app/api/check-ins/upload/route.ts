import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();
        if (!userId) throw new Error("Not signed in.");
        if (!pathname.startsWith("check-ins/")) throw new Error("Invalid upload path.");

        return {
          allowedContentTypes: ["image/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: 15 * 1024 * 1024,
        };
        // onUploadCompleted intentionally omitted: this app persists photo URLs when the whole
        // daily-log form submits, not via a completion webhook, so there's nothing for one to do.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
