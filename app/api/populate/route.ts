import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { email, first_name, last_name, address } = await request.json();
    console.log("Received data for client update:", { email, first_name, last_name, address });

    if (!email) {
      console.error("No email provided");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "no rows returned"
      console.error("Error checking existing client:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing client" },
        { status: 500 }
      );
    }

    if (existingClient) {
      // Update existing client
      const { data: updatedClient, error: updateError } = await supabase
        .from("clients")
        .update({
          first_name: first_name || existingClient.first_name,
          last_name: last_name || existingClient.last_name,
          address: address || existingClient.address,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating client:", updateError);
        return NextResponse.json(
          { error: `Failed to update client: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log("Successfully updated client:", updatedClient);
      return NextResponse.json({ success: true, client: updatedClient }, { status: 200 });
    } else {
      // Create new client
      const username = email.split('@')[0];
      const { data: newClient, error: createError } = await supabase
        .from("clients")
        .insert([
          {
            email: email,
            username: username,
            clerk_id: user.id,
            first_name: first_name || username,
            last_name: last_name || "",
            address: address || "",
            cart: [],
            wishlist: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("Error creating client:", createError);
        return NextResponse.json(
          { error: `Failed to create client: ${createError.message}` },
          { status: 500 }
        );
      }

      console.log("Successfully created client:", newClient);
      return NextResponse.json({ success: true, client: newClient }, { status: 200 });
    }
  } catch (error) {
    console.error("Error in populate route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
