const API_BASE = "https://api-v2.fattureincloud.it";

interface IssuedDocumentEntity {
  name: string;
  vat_number?: string;
  tax_code?: string;
  address_street?: string;
  address_postal_code?: string;
  address_city?: string;
  country?: string;
  certified_email?: string;
  ei_code?: string;
}

interface IssuedDocumentItem {
  name: string;
  qty: number;
  net_price: number;
  vat: { value: number };
}

interface CreateIssuedDocumentInput {
  type: "invoice" | "receipt";
  entity: IssuedDocumentEntity;
  items: IssuedDocumentItem[];
  eInvoice: boolean;
}

function getCredentials() {
  const token = process.env.FATTURE_IN_CLOUD_ACCESS_TOKEN;
  const companyId = process.env.FATTURE_IN_CLOUD_COMPANY_ID;
  if (!token || !companyId) return null;
  return { token, companyId };
}

export function isFattureInCloudConfigured(): boolean {
  return getCredentials() !== null;
}

// Manual Authentication mode (a long-lived token generated once in Fatture in Cloud's own
// Settings -> Connected Applications): simplest fit for a single-company integration like this
// one, no OAuth refresh-token lifecycle to maintain. See developers.fattureincloud.it/docs/authentication.
export async function createIssuedDocument(input: CreateIssuedDocumentInput): Promise<{ id: string }> {
  const credentials = getCredentials();
  if (!credentials) throw new Error("Fatture in Cloud is not configured (missing env vars)");

  const res = await fetch(`${API_BASE}/c/${credentials.companyId}/issued_documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: input.type,
        entity: input.entity,
        date: new Date().toISOString().slice(0, 10),
        currency: { id: "EUR" },
        items_list: input.items,
        e_invoice: input.eInvoice,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fatture in Cloud ${res.status}: ${text}`);
  }

  const json = await res.json();
  return { id: String(json.data.id) };
}
