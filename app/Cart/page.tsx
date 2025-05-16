"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Alert from "@/components/Alert";
import { Trash2, Minus, Plus } from "lucide-react";

const logo = "/logo.png";

interface CartProduct {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  description?: string;
  category?: string;
  stock?: number;
  formattedPrice: string;
  cancelledPrice?: number;
  formattedCancelledPrice?: string;
}

interface AlertState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const CartPage = () => {
  const { isSignedIn } = useUser();
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [morphedProducts, setMorphedProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = useCallback((message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  const asyncHandler = useCallback(async () => {
    try {
      const response = await axios.get<CartProduct[]>("/api/cart");

      if (response.status === 200 && response.data) {
        setCartProducts(response.data);
        const initialQuantities = response.data.reduce(
          (acc: { [key: string]: number }, product: CartProduct) => {
            acc[product._id] = product.quantity || 1;
            return acc;
          },
          {}
        );
        setQuantities(initialQuantities);
        setMorphedProducts(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        setCartProducts([]);
        setMorphedProducts([]);
      } else {
        showAlert("Failed to fetch cart items", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (isSignedIn) {
      asyncHandler();
    }
  }, [isSignedIn, asyncHandler]);

  const handleQuantityChange = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
  }, []);

  const calculateSubtotal = useCallback(() => {
    return morphedProducts.reduce((total, product) => {
      const quantity = quantities[product._id] || 1;
      return total + product.price * quantity;
    }, 0);
  }, [morphedProducts, quantities]);

  const removeFromCart = useCallback(async (productId: string) => {
    setMorphedProducts((prev) => prev.filter((product) => product._id !== productId));

    try {
      const response = await axios.delete(`/api/cart?productId=${productId}`);

      if (response.status === 200) {
        showAlert("Item removed from cart", "success");
      } else {
        await asyncHandler();
        throw new Error("Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      showAlert("Failed to remove item from cart", "error");
      await asyncHandler();
    }
  }, [asyncHandler, showAlert]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center px-4">
          <p className="text-lg text-gray-600">Please sign in to view your cart.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
        />
      )}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[2560px] 2xl:px-16 4xl:px-32 4xl:min-h-[90vh]">
        <div className="mb-6 4xl:mb-24">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-gray-600 hover:text-gray-900 4xl:text-3xl">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 4xl:text-3xl">Cart</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px] 4xl:min-h-[1000px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Image src={logo} alt="Loading..." width={60} height={60} className="4xl:w-40 4xl:h-40" />
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 4xl:gap-24 4xl:min-h-[80vh]">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 4xl:p-20 4xl:min-h-[80vh]">
                <h1 className="text-2xl font-semibold text-gray-900 mb-6 4xl:text-6xl 4xl:mb-20">Shopping Cart</h1>
                {morphedProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 4xl:py-40">
                    <p className="text-gray-500 text-lg mb-4 4xl:text-4xl 4xl:mb-12">Your cart is empty</p>
                    <a
                      href="/"
                      className="text-[#DB4444] hover:text-[#c13a3a] font-medium 4xl:text-3xl"
                    >
                      Continue Shopping
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6 4xl:space-y-20">
                    {morphedProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b last:border-b-0 4xl:p-16 4xl:gap-16"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="relative w-[120px] h-[120px] flex-shrink-0 4xl:w-[400px] 4xl:h-[400px]">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md 4xl:rounded-2xl"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 4xl:text-4xl">{product.name}</h3>
                            <div className="flex items-center gap-2 mt-1 4xl:mt-6">
                              <span className="text-lg font-semibold text-gray-900 4xl:text-4xl">{product.formattedPrice}</span>
                              {product.cancelledPrice && (
                                <span className="text-sm text-gray-500 line-through 4xl:text-3xl">
                                  {product.formattedCancelledPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 4xl:gap-16">
                          <div className="flex items-center border rounded-md 4xl:rounded-2xl">
                            <button
                              onClick={() => handleQuantityChange(product._id, (quantities[product._id] || 1) - 1)}
                              className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 4xl:p-8"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4 4xl:w-12 4xl:h-12" />
                            </button>
                            <span className="px-4 py-2 text-gray-900 4xl:px-12 4xl:py-6 4xl:text-3xl">
                              {quantities[product._id] || 1}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(product._id, (quantities[product._id] || 1) + 1)}
                              className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 4xl:p-8"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4 4xl:w-12 4xl:h-12" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(product._id)}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors 4xl:p-8"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-5 h-5 4xl:w-14 4xl:h-14" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8 4xl:p-20 4xl:top-12 4xl:min-h-[80vh]">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 4xl:text-5xl 4xl:mb-16">Order Summary</h2>
                <div className="space-y-4 4xl:space-y-12">
                  <div className="flex justify-between text-gray-600 4xl:text-3xl">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 4xl:text-3xl">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-4 mt-4 4xl:pt-12 4xl:mt-12">
                    <div className="flex justify-between text-lg font-semibold text-gray-900 4xl:text-4xl">
                      <span>Total</span>
                      <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="w-full bg-[#DB4444] text-white py-3 rounded-md mt-6 font-medium hover:bg-[#c13a3a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#DB4444] focus:ring-offset-2 4xl:py-12 4xl:text-3xl 4xl:rounded-2xl 4xl:mt-16"
                  onClick={() => {
                    showAlert("Checkout functionality coming soon!", "success");
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
