// services/address.ts
import { Address } from "@/utils/types";

// GET /address — fetch all addresses
export async function getAddresses(): Promise<Address[]> {
  const res = await fetch("/api/address", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch addresses: ${res.status}`);
  }

  return res.json();
}

// POST /address — add a new address
export interface AddressInput {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

export async function addAddress(data: AddressInput): Promise<Address> {
  const res = await fetch("/api/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Add address failed: ${res.status} - ${msg}`);
  }

  return res.json();
}

// DELETE /address/:id — delete address
export async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`/api/address/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Delete address failed: ${res.status}`);
  }
}
