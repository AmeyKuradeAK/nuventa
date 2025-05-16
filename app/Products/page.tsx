"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import React, { useEffect, useState } from "react";
import Heading from "@/components/Heading";
import Card from "@/components/Card";
import axios from "axios";
import { motion } from "framer-motion";
import Image from "next/image";

const logo = "/logo.png";

const Page = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.post(`/api/propagation`, {
          every: true,
        });
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  return (
    <div>
      <Navbar />
      <div className="sm:p-4 p-0">
        <div className="mt-6 sm:ml-4 ml-0 xl:ml-32">
          <div className="flex flex-col gap-6">
            <div className="flex w-full justify-between items-center">
              <Heading message="Products" secondaryMessage="" />
            </div>
            <div className="flex flex-col gap-12 w-fit mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full">
                {products.map((product: any, index: any) => (
                  <Card
                    id={product.id}
                    key={index}
                    productName={product.product_name}
                    productPrice={product.product_price}
                    cancelledPrice={product.cancelled_product_price}
                    src={
                      product.product_images && 
                      Array.isArray(product.product_images) && 
                      product.product_images.length > 0
                        ? product.product_images[0]
                        : "https://fastly.picsum.photos/id/1050/536/354.jpg?hmac=fjxUSeQRIROZvo_be9xEf-vMhMutXf2F5yw-WaWyaWA"
                    }
                    status={product.latest ? "new" : "old"}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Page;
