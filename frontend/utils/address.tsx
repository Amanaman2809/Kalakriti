import { Address } from "@/utils/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) throw new Error("API base URL is not set");

const API_TIMEOUT = 10000; // 10 seconds

type ApiError = {
  name: string;
  status: number;
  message: string;
  raw?: any;
};

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      credentials: "include",
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function handleApiError(error: any, defaultMessage: string): never {
  if (error.name === "AbortError") {
    throw new Error(`${defaultMessage} request timed out.`);
  }
  console.error(`${defaultMessage}:`, error.message || error);
  throw new Error(error.message || defaultMessage);
}

export async function getAddresses(): Promise<Address[]> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/address`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        name: "GetAddressesError",
        status: response.status,
        message: errorData.message || response.statusText,
        raw: errorData,
      } as ApiError;
    }
    const res = await response.json();
    const data = res?.data;

    return data;
  } catch (error) {
    handleApiError(error, "Failed to fetch addresses");
  }
}

export interface AddressInput {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

export async function addAddress(data: AddressInput): Promise<Address> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/address`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        name: "AddAddressError",
        status: response.status,
        message: errorData.message || response.statusText,
        raw: errorData,
      } as ApiError;
    }
    const res = await response.json();
    const d = res?.d;

    return d;
  } catch (error) {
    handleApiError(error, "Failed to add address");
  }
}

export async function updateAddress(
  id: string,
  data: AddressInput
): Promise<Address> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/address/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        name: "UpdateAddressError",
        status: response.status,
        message: errorData.message || response.statusText,
        raw: errorData,
      } as ApiError;
    }
    const res = await response.json();
    const d = res?.d;

    return d;
  } catch (error) {
    handleApiError(error, "Failed to update address");
  }
}

export async function deleteAddress(id: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/address/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        name: "DeleteAddressError",
        status: response.status,
        message: errorData.message || response.statusText,
        raw: errorData,
      } as ApiError;
    }
  } catch (error) {
    handleApiError(error, "Failed to delete address");
  }
}

export async function setDefaultAddress(id: string): Promise<Address> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/address/${id}/set-default`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        name: "SetDefaultAddressError",
        status: response.status,
        message: errorData.message || response.statusText,
        raw: errorData,
      } as ApiError;
    }
    const res = await response.json();
    const data = res?.data;

    return data;
  } catch (error) {
    handleApiError(error, "Failed to set default address");
  }
}
