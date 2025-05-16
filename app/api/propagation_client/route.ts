import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import supabase from "@/lib/supabase";

export async function GET() {
  const user = await currentUser();
  const global_user_email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

  console.log("Fetching client data for user:", user?.id); // Debug log
  console.log("User email:", global_user_email); // Debug log

  if (!user || !global_user_email) {
    console.log("User not authenticated or no email found"); // Debug log
    return NextResponse.json({ message: "User not authenticated" }, { status: 401 });
  }

  try {
    console.log("Querying Supabase for client data..."); // Debug log
    const { data: clientData, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", global_user_email)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ message: "Database error", error }, { status: 500 });
    }

    console.log("Raw client data from Supabase:", clientData); // Debug log

    if (!clientData) {
      console.log("No client data found for email:", global_user_email); // Debug log
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }

    // Map Supabase field names to the expected response format
    const response = {
      firstName: clientData.first_name || "",
      lastName: clientData.last_name || "",
      address: clientData.address || "",
      wishlist: clientData.wishlist || [],
      cart: clientData.cart || [],
    };

    console.log("Transformed client data:", response); // Debug log

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Unhandled error in propagation_client API:", error);
    return NextResponse.json(
      {
        message: "Error fetching client data",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
