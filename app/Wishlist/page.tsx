"use client";
import React, { useEffect, useState, useCallback } from "react";
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
import Card from "@/components/Card";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { GlobalContext } from "@/context/Global";
import { useContext } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Alert from "@/components/Alert";

/**
 * 1.Pretty exhausting function (handleBag) running in O(n^2) probably. Considering the post requests to be linear.
 * 2.The mechanism is straightforward, if an item from the wishlist is not present in the global cart, add it.
 * 3.T̶O̶D̶O̶:̶ b̶u̶g̶:̶ g̶l̶o̶b̶a̶l̶ c̶a̶r̶t̶ i̶s̶ u̶p̶d̶a̶t̶e̶d̶ b̶u̶t̶ t̶h̶e̶ d̶a̶t̶a̶b̶a̶s̶e̶ w̶a̶s̶ n̶o̶t̶ u̶p̶d̶a̶t̶e̶d̶.̶ (̶f̶i̶x̶e̶d̶)̶
 * 3.T̶O̶D̶O̶:̶ b̶u̶g̶: n̶u̶l̶l̶ |̶ u̶n̶d̶e̶f̶i̶n̶e̶d̶ |̶ [̶]̶ r̶e̶s̶p̶o̶n̶s̶e̶ w̶i̶l̶l̶ m̶e̶s̶s̶ w̶i̶t̶h̶ t̶h̶e̶ m̶a̶p̶ f̶u̶n̶c̶t̶i̶o̶n̶ (̶f̶i̶x̶e̶d̶)̶
 */

const logo = "/logo.png";

interface WishlistProduct {
  _id: string;
  name: string;
  price: number;
  image: string;
  status?: string;
}

interface AlertState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const Wishlist = () => {
  const { isSignedIn } = useUser();
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCart, setUpdatingCart] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  });

  const context = useContext(GlobalContext);
  if (!context) throw new Error("GlobalContext is not provided.");
  const { GlobalWishlist, GlobalCart, changeGlobalCart } = context;

  const url_params = useParams();

  const showAlert = useCallback((message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      console.log("Fetching wishlist..."); // Debug log
      const response = await axios.post<WishlistProduct[]>("/api/propagation", {
        type: "wishlist",
      });

      console.log("Wishlist API response:", response.data); // Debug log

      if (response.status === 200 && Array.isArray(response.data)) {
        // Ensure each product has all required fields
        const validProducts = response.data.filter(product => {
          const isValid = product && 
            product._id && 
            product.name && 
            product.price && 
            product.image;
          
          if (!isValid) {
            console.log("Invalid product:", product); // Debug log for invalid products
          }
          return isValid;
        }).map(product => ({
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          status: product.status || "new"
        }));
        
        console.log("Processed wishlist products:", validProducts); // Debug log
        setWishlistProducts(validProducts);
      } else {
        console.error("Invalid response format:", response.data); // Debug log
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      const axiosError = error as { response?: { status: number; data?: any } };
      if (axiosError.response?.status === 404) {
        console.log("No wishlist found (404)"); // Debug log
        setWishlistProducts([]);
      } else {
        console.error("Wishlist fetch error:", axiosError.response?.data); // Debug log
        showAlert("Failed to fetch wishlist items", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (isSignedIn) {
      fetchWishlist();
    }
  }, [isSignedIn, fetchWishlist]);

  // Add a debug effect to monitor wishlistProducts
  useEffect(() => {
    console.log("Current wishlist products:", wishlistProducts);
  }, [wishlistProducts]);

  const handleBag = useCallback(async () => {
    if (updatingCart) return;
    setUpdatingCart(true);

    try {
      const itemsToAdd = GlobalWishlist.filter(id => !GlobalCart.includes(id));
      
      if (itemsToAdd.length === 0) {
        showAlert("All items are already in your cart!", "success");
        setUpdatingCart(false);
        return;
      }

      // Optimistically update the UI
      const optimisticUpdates = itemsToAdd.map(id => {
        changeGlobalCart(id, true);
        return id;
      });

      const results = await Promise.all(
        itemsToAdd.map(async (id) => {
          try {
            const response = await axios.post(`/api/cart`, {
              identifier: id,
              append: true,
            });
            
            if (response.status === 200 || response.data === 200) {
              return { id, success: true };
            }
            // Revert optimistic update on failure
            changeGlobalCart(id, false);
            return { id, success: false };
          } catch (error) {
            console.error(`Error adding item ${id} to cart:`, error);
            // Revert optimistic update on error
            changeGlobalCart(id, false);
            return { id, success: false };
          }
        })
      );

      const successfulUpdates = results.filter(result => result.success);
      
      if (successfulUpdates.length > 0) {
        showAlert(`Successfully added ${successfulUpdates.length} items to your cart!`, "success");
      }

      if (successfulUpdates.length < itemsToAdd.length) {
        showAlert("Some items could not be added to your cart. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      showAlert("There was an error updating your cart. Please try again.", "error");
    } finally {
      setUpdatingCart(false);
    }
  }, [updatingCart, GlobalWishlist, GlobalCart, changeGlobalCart, showAlert]);

  if (!isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl">Please sign in to view your wishlist</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-[80vh]">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Image src={logo} alt="Loading..." width={60} height={60} />
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!wishlistProducts.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl">Your wishlist is empty</h1>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
        />
      )}
      <div className="p-4">
        <div className="mt-6 ml-4 xl:ml-32">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Wishlist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-col xl:flex-col xl:justify-between xl:w-[1170px] w-full xl:ml-28 mt-8">
          <div className="flex flex-col xl:flex-row xl:justify-between">
            <div>
              <h1 className="p-5">Wishlist ({wishlistProducts.length})</h1>
            </div>
            <div>
              <button
                className={`w-full xl:w-[223px] h-[56px] text-center border border-black ${
                  updatingCart ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleBag}
                disabled={updatingCart}
              >
                {updatingCart ? "Moving to cart..." : "Move All to bag"}
              </button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-x-5 w-full mt-7">
            {wishlistProducts.map((product) => (
              <Card
                key={product._id}
                id={product._id}
                src={product.image}
                productName={product.name}
                productPrice={product.price}
                cancelledPrice={product.price * 1.2}
                status={product.status || "new"}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
