import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch client data with cart items
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('cart')
      .eq('clerk_id', user.id)
      .single();

    if (clientError) throw clientError;

    // Handle empty cart
    if (!clientData?.cart || !Array.isArray(clientData.cart) || clientData.cart.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch product data for cart items
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        images,
        category,
        stock,
        created_at
      `)
      .in('id', clientData.cart);

    if (productsError) throw productsError;

    // Transform the data to match the expected format
    const transformedCartItems = products.map((product) => ({
      _id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '/placeholder.png',
      quantity: 1 // Default quantity
    }));

    return NextResponse.json(transformedCartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { productId } = await request.json();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get current cart
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('cart')
      .eq('clerk_id', user.id)
      .single();

    if (clientError) throw clientError;

    // Initialize cart as empty array if it doesn't exist
    const currentCart = Array.isArray(clientData?.cart) ? clientData.cart : [];
    
    if (currentCart.includes(productId)) {
      return NextResponse.json(
        { error: 'Item already in cart' },
        { status: 400 }
      );
    }

    // Add item to cart
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        cart: [...currentCart, productId],
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get productId from URL
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current cart
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('cart')
      .eq('clerk_id', user.id)
      .single();

    if (clientError) throw clientError;

    // Initialize cart as empty array if it doesn't exist
    const currentCart = Array.isArray(clientData?.cart) ? clientData.cart : [];
    const updatedCart = currentCart.filter((id: string) => id !== productId);

    // Update cart
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        cart: updatedCart,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
} 