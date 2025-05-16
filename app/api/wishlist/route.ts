import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import supabase from "@/lib/supabase";

function popElement(array: any[], victim: any) {
  return array.filter((element) => element !== victim);
}

export async function POST(request: any) {
  const user = await currentUser();
  
  if (!user) {
    console.log("No active session found");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Fetch current client data
    const { data: existingClient, error: fetchError } = await supabase
      .from("clients")
      .select("wishlist")
      .eq("clerk_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching client data:", fetchError);
      return NextResponse.json(
        { message: "Failed to fetch wishlist", error: fetchError.message },
        { status: 500 }
      );
    }

    let updatedWishlist = existingClient?.wishlist || [];

    if (body.append) {
      // Add identifier only if it doesn't exist
      if (!updatedWishlist.includes(body.identifier)) {
        updatedWishlist.push(body.identifier);
      }
    } else {
      // Remove identifier
      updatedWishlist = popElement(updatedWishlist, body.identifier);
    }

    // Update wishlist in database
    const { error: updateError } = await supabase
      .from("clients")
      .update({ 
        wishlist: updatedWishlist,
        updated_at: new Date().toISOString()
      })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating wishlist:", updateError);
      return NextResponse.json(
        { message: "Failed to update wishlist", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Wishlist updated", wishlist: updatedWishlist },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in wishlist route:", error);
    return NextResponse.json(
      { message: "Bad Request", error: error.message },
      { status: 400 }
    );
  }
}
