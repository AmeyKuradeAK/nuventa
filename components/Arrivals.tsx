import React from "react";
import Heading from "./Heading";
import Card from "./Card";
import Button from "./button";
import Link from "next/link";

type mainProp = {
  fragment: {
    id: string;
    productName: string;
    productImages: string[];       // array of URLs
    productPrice: string;
    cancelledProductPrice: string;
    latest: boolean;
  }[];
};

export default function Arrivals({ fragment }: mainProp) {
  return (
    <>
      <div className="mt-28 md:mt-0 xl:mt-0 lg:mt-0 flex flex-col gap-14">
        <div className="flex w-full justify-between items-center 2xl:mb-7 xl:mb-3">
          <Heading
            message="Newest Arrivals"
            secondaryMessage="Nuvante's Atelier"
          />
          {/* <Link href="/Products">
            <Button text="View All" width={130} />
          </Link> */}
        </div>
        <div className="flex flex-col gap-12 w-fit mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full">
            {fragment.map((product, index) => (
              <Card
                key={product.id}
                id={product.id}
                productName={product.productName}
                productPrice={Number(product.productPrice)}
                cancelledPrice={Number(product.cancelledProductPrice)}
                src={product.productImages?.[0] ?? "/fallback-image.jpg"}
                status={product.latest ? "new" : "old"}
              />
            ))}
          </div>
          <Link href="/Products" className="mx-auto w-fit">
            <Button text="View All Products" width={220} />
          </Link>
        </div>
      </div>
    </>
  );
}
