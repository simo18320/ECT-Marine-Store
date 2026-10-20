import { redirect } from "next/navigation";

// "Ask ECT" now lives inside the product finder, so there is a single place to search.
export default function AssistantPage() {
  redirect("/find-product");
}
