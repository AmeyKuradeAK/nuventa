import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import supabase from "@/lib/supabase"; // centralized supabase client

function popElement(array: any[], victim: any) {
  return array.filter((element) => element !== victim);
}

export async function GET(request: any) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clerk_id = user.id;
    console.log("Fetching cart for user:", clerk_id);

    // Get cart IDs
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("cart")
      .eq("clerk_id", clerk_id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return new NextResponse("Failed to fetch client data", { status: 500 });
    }

    if (!client) {
      console.log("No client found for user:", clerk_id);
      return NextResponse.json([]);
    }

    const cart = client.cart || [];
    console.log("Cart items:", cart);

    if (!cart.length) {
      console.log("Cart is empty");
      return NextResponse.json([]);
    }

    // Fetch product details with exact schema
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        product_name,
        product_images,
        product_price,
        cancelled_product_price,
        latest,
        description,
        materials,
        packaging,
        shipping,
        product_info,
        type
      `)
      .in("id", cart);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return new NextResponse("Failed to fetch products", { status: 500 });
    }

    if (!products || !products.length) {
      console.log("No products found for cart items");
      return NextResponse.json([]);
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map((product) => ({
      _id: product.id,
      name: product.product_name,
      price: Number(product.product_price),
      formattedPrice: `₹${Number(product.product_price).toLocaleString('en-IN')}`,
      image: product.product_images?.[0] || '/placeholder.png',
      description: product.description,
      materials: product.materials,
      packaging: product.packaging,
      shipping: product.shipping,
      productInfo: product.product_info,
      type: product.type,
      cancelledPrice: Number(product.cancelled_product_price),
      formattedCancelledPrice: `₹${Number(product.cancelled_product_price).toLocaleString('en-IN')}`,
      isLatest: product.latest,
      quantity: 1 // Default quantity
    }));

    console.log("Transformed products:", transformedProducts);
    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Unexpected error in cart GET:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: any) {
  const user = await currentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const clerk_id = user.id;

  try {
    const body = await request.json();

    // Supabase flow only
    const { data: client, error } = await supabase
      .from("clients")
      .select("cart")
      .eq("clerk_id", clerk_id)
      .single();

    if (error || !client) {
      console.error("Supabase client fetch error:", error);
      return new NextResponse("Client not found", { status: 404 });
    }

    let cart = client.cart || [];

    if (body.append) {
      if (!cart.includes(body.identifier)) {
        cart.push(body.identifier);
      }
    } else {
      cart = popElement(cart, body.identifier);
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({ cart })
      .eq("clerk_id", clerk_id);

    if (updateError) {
      console.error("Supabase cart update error:", updateError);
      return new NextResponse("Failed to update cart", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error in cart POST:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
