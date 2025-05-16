"use client";

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

interface GlobalContextType {
  GlobalWishlist: string[];
  GlobalCart: string[];
  changeGlobalWishlist: (updatedWishlist: string[] | string, append?: boolean) => Promise<void>;
  changeGlobalCart: (identifier: string, append: boolean) => Promise<void>;
}

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [GlobalWishlist, setGlobalWishlist] = useState<string[]>([]);
  const [GlobalCart, setGlobalCart] = useState<string[]>([]);
  const { isSignedIn } = useUser();

  const fetchClientData = async () => {
    try {
      const response = await axios.get("/api/propagation_client", {
        validateStatus: () => true, // Allows manual status checks
      });

      if (response.status === 200) {
        setGlobalWishlist(response.data.wishlist || []);
        setGlobalCart(response.data.cart || []);
      } else if (response.status === 404) {
        console.warn("No client data found at /api/propagation_client (likely first-time user).");
      } else {
        console.error(`Unexpected status code ${response.status} from /api/propagation_client`);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchClientData();
    } else {
      setGlobalWishlist([]);
      setGlobalCart([]);
    }
  }, [isSignedIn]);

  const changeGlobalWishlist = async (updatedWishlist: string[] | string, append?: boolean) => {
    try {
      if (typeof updatedWishlist === 'string') {
        // Handle single item update
        const currentWishlist = [...GlobalWishlist];
        if (append) {
          if (!currentWishlist.includes(updatedWishlist)) {
            currentWishlist.push(updatedWishlist);
          }
        } else {
          const index = currentWishlist.indexOf(updatedWishlist);
          if (index > -1) {
            currentWishlist.splice(index, 1);
          }
        }
        setGlobalWishlist(currentWishlist);
      } else {
        // Handle array update
        setGlobalWishlist(updatedWishlist);
      }
      await fetchClientData();
    } catch (error) {
      console.error("Error updating wishlist:", error);
      alert("Failed to update wishlist on server.");
    }
  };

  const changeGlobalCart = async (identifier: string, append: boolean) => {
    try {
      await axios.post("/api/cart", { identifier, append });
      await fetchClientData();
    } catch (error) {
      console.error("Error updating cart:", error);
      alert("Failed to update cart on server.");
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        GlobalWishlist,
        GlobalCart,
        changeGlobalWishlist,
        changeGlobalCart,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
