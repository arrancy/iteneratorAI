import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { addProfilePictureSchema } from "@/zodTypes/addProfilepicture";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import prisma from "@/lib/db/singleton";
import z from "zod";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ msg: "unauthenticated" }, { status: 401 });
    }
    const reqBody = await req.json();
    const { success } = addProfilePictureSchema.safeParse(reqBody);
    if (!success) {
      return NextResponse.json({ msg: "invalid inputs" }, { status: 403 });
    }
    const photoMetadata = reqBody as z.infer<typeof addProfilePictureSchema>;
    const { fileName, imageFormat, fileSize } = photoMetadata;

    const addedToDatabase = await prisma.profilePicture.create({
      data: {
        originalFileName: fileName,
        imageFormat,
        fileSize,
        userId: session.user.id,
      },
    });

    if (!addedToDatabase) {
      return NextResponse.json(
        { msg: "could not add fileMetadata to database" },
        { status: 500 },
      );
    }

    const s3Client = new S3Client({
      region: "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: "itenerator",
      Key: `profilepictures/${session.user.id}/image-${Date.now()}.${imageFormat === "jpeg" || imageFormat === "jpg" ? `jpeg` : `png`}`,
      Conditions: [
        ["content-length-range", 0, 10 * 1024 * 1024],
        {
          "Content-Type":
            "image/" +
            (imageFormat === "jpeg" || imageFormat === "jpg" ? "jpeg" : "png"),
        },
      ],
      Fields: {
        "Content-Type":
          "image/" +
          (imageFormat === "jpeg" || imageFormat === "jpg" ? "jpeg" : "png"),
      },
      // Expires: 60,
    });
    if (!url)
      return NextResponse.json(
        { msg: "internal server error" },
        { status: 500 },
      );

    return NextResponse.json({ url, fields });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: "internal server error" }, { status: 500 });
  }
}
