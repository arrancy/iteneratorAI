import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { addProfilePictureSchema } from "@/zodTypes/addProfilepicture";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.id) {
    return NextResponse.json({ msg: "unauthenticated" }, { status: 401 });
  }
  const reqBody = await req.json();
  const { success } = addProfilePictureSchema.safeParse(reqBody);
  if (!success) {
    return NextResponse.json({ msg: "invalid inputs" }, { status: 403 });
  }
}
