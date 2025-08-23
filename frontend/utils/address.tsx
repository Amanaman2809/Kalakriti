import { Address } from "@/utils/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) throw new Error("API base URL is not set");

const API_TIMEOUT = 10000;

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit): Promise<Response> {
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

export async function getAddresses(): Promise<Address[]> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    // FIXED: Use /api/addresses (plural) to match your Express route
    console.log('Fetching addresses from:', `${API_BASE_URL}/api/addresses`);

    const response = await fetchWithTimeout(`${API_BASE_URL}/api/addresses`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Address API response status:', response.status);

    if (response.status === 404) {
      console.warn('Address endpoint not found - returning empty array');
      return [];
    }

    if (response.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }

    if (response.status === 403) {
      throw new Error("Access denied. Please check your permissions.");
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.warn('Failed to parse error JSON:', e);
        }
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Expected JSON but got content-type:', contentType);
      throw new Error('Invalid response format - expected JSON');
    }

    const result = await response.json();
    console.log('Addresses response:', result);

    // Handle your API response structure: { success: true, data: addresses }
    if (result.success && result.data) {
      return result.data;
    }

    // Fallback for other response formats
    return result?.addresses || result || [];
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out while fetching addresses");
    }

    console.error("Failed to fetch addresses:", error);
    throw error;
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
    // FIXED: Use /api/addresses (plural)
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/addresses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      throw new Error("Address API endpoint not found. Please contact support.");
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Failed to add address: ${response.status} ${response.statusText}`;

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;

          // Handle validation errors from express-validator
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationErrors = errorData.errors.map((err: any) => err.msg).join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
          }
        } catch (e) {
          console.warn('Failed to parse error JSON:', e);
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Handle your API response structure: { success: true, data: address }
    if (result.success && result.data) {
      return result.data;
    }

    return result;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out while adding address");
    }

    console.error("Failed to add address:", error);
    throw error;
  }
}

export async function updateAddress(id: string, data: AddressInput): Promise<Address> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    // FIXED: Use /api/addresses (plural)
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/addresses/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      throw new Error("Address not found or endpoint not available");
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Failed to update address: ${response.status} ${response.statusText}`;

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;

          // Handle validation errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationErrors = errorData.errors.map((err: any) => err.msg).join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
          }
        } catch (e) {
          console.warn('Failed to parse error JSON:', e);
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Handle your API response structure
    if (result.success && result.data) {
      return result.data;
    }

    return result;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out while updating address");
    }

    console.error("Failed to update address:", error);
    throw error;
  }
}

export async function deleteAddress(id: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    // FIXED: Use /api/addresses (plural)
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/addresses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      throw new Error("Address not found or already deleted");
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Failed to delete address: ${response.status} ${response.statusText}`;

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.warn('Failed to parse error JSON:', e);
        }
      }

      throw new Error(errorMessage);
    }

    // For 204 No Content, there's no response body to parse
    if (response.status === 204) {
      return;
    }

    // Handle any other successful response
    try {
      const result = await response.json();
      console.log('Delete response:', result);
    } catch (e) {
      // It's okay if there's no JSON response for delete
      console.log('No JSON response for delete operation');
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out while deleting address");
    }

    console.error("Failed to delete address:", error);
    throw error;
  }
}

export async function setDefaultAddress(id: string): Promise<Address> {
  if (typeof window === "undefined") {
    throw new Error("Client-side only function");
  }

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  try {
    // FIXED: Use /api/addresses (plural)
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/addresses/${id}/set-default`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      throw new Error("Address not found");
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Failed to set default address: ${response.status} ${response.statusText}`;

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.warn('Failed to parse error JSON:', e);
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Handle your API response structure
    if (result.success && result.data) {
      return result.data;
    }

    return result;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out while setting default address");
    }

    console.error("Failed to set default address:", error);
    throw error;
  }
}
