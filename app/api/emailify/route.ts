import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();

  if (!user) {
    console.log("No user is signed in.");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const global_user_email = user.emailAddresses[0]?.emailAddress || "";
    return new NextResponse(global_user_email, { status: 200 });
  } catch (error) {
    console.error("Error fetching user email:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
