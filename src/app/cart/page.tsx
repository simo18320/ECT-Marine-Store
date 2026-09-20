import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { CartClient } from "@/components/cart/cart-client";
import { getShippingSettings } from "@/lib/settings/queries";

export default async function CartPage() {
  return (
    <>
      <SiteHeader />
      <CartClient shippingSettings={await getShippingSettings()} />
      <SiteFooter />
    </>
  );
}
