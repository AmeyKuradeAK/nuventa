"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Heading from "@/components/Heading";
import Card from "@/components/Card";
import productModel from "@/models/Product";
import { headers } from "next/headers";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";

const Page = () => {
  let [data, setData]: any[] = useState([]);
  let params = useParams();
  let [loaded, setLoaded] = useState<Boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post("/api/propagation", {
          every: true,
        });
        setData(response.data);
        setLoaded(true);
      } catch (error) {
        setData([]);
      }
    })();
  }, []);

  return (
    <>
      <div>
        <Navbar />
        <div className="p-4">
          <div className="mt-6 ml-4 xl:ml-32">
            <div className="flex flex-col gap-6">
              <div className="flex w-full justify-between items-center">
                <Heading message="Products" secondaryMessage="" />
              </div>
              <div className="flex flex-col gap-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full">
                  {loaded ? (
                    data.length > 0 ? (
                      data.map((product: any, index: any) =>
                        product.type === params.slug ? (
                          <Card
                            id={product._id}
                            key={index}
                            productName={product.productName}
                            productPrice={product.productPrice}
                            cancelledPrice={product.cancelledProductPrice}
                            src={product.productImages?.[0] || ""}
                            status={product.latest ? "new" : "old"}
                          />
                        ) : (
                          ""
                        )
                      )
                    ) : (
                      <p>No products were found!</p>
                    )
                  ) : (
                    <p>Loading...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Page;
