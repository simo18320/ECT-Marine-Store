import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { CartClient } from "@/components/cart/cart-client";

export default async function CartPage() {
  return (
    <>
      <SiteHeader />
      <CartClient />
      <SiteFooter />
    </>
  );
}
