// lib/services/api-client.ts - ENHANCED FOR ASGARDEO
import type { AuthService } from "./auth-service";
import { ApiError } from "@/lib/utils/error-handler";

export class ApiClient {
  private baseURL: string;
  private authService: AuthService;

  constructor(baseURL: string, authService: AuthService) {
    this.baseURL = baseURL.replace(/\/+$/, "");
    this.authService = authService;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.authService.isAuthenticated()) {
      console.log("=== API CLIENT HEADER SETUP ===");
      console.log("User is authenticated, getting token...");
      console.log("Auth mode:", this.authService.getAuthMode());

      const token = await this.authService.getAccessToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("✅ Authorization header set");
        console.log("Token starts with:", token.substring(0, 20) + "...");
        console.log("Token length:", token.length);

        // Additional validation for Asgardeo tokens
        if (this.authService.getAuthMode() === "asgardeo") {
          console.log("🔍 Asgardeo token validation:");
          try {
            // Basic JWT structure check
            const parts = token.split(".");
            if (parts.length === 3) {
              console.log("✅ Valid JWT structure (3 parts)");

              // Decode header to check algorithm
              const header = JSON.parse(atob(parts[0]));
              console.log("JWT header:", header);

              // Decode payload to check claims
              const payload = JSON.parse(atob(parts[1]));
              console.log("JWT payload (key claims):", {
                iss: payload.iss,
                sub: payload.sub,
                aud: payload.aud,
                exp: payload.exp,
                iat: payload.iat,
                preferred_username: payload.preferred_username,
                email: payload.email,
                groups: payload.groups,
              });

              // Check if token is expired
              const now = Math.floor(Date.now() / 1000);
              if (payload.exp && payload.exp < now) {
                console.warn("⚠️ Token appears to be expired");
              } else {
                console.log("✅ Token is not expired");
              }
            } else {
              console.warn("⚠️ Invalid JWT structure");
            }
          } catch (decodeError) {
            console.warn(
              "⚠️ Could not decode JWT for validation:",
              decodeError
            );
          }
        }
      } else {
        console.error("❌ No token available despite being authenticated");
        console.log("Auth state:", {
          isAuthenticated: this.authService.isAuthenticated(),
          isLoading: this.authService.isLoading(),
          username: this.authService.getUsername(),
          authMode: this.authService.getAuthMode(),
        });
      }
    } else {
      console.log("❌ User not authenticated, no token added");
    }

    console.log("Final headers:", Object.keys(headers));
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log("=== API RESPONSE HANDLING ===");
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorDetails = "";

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = JSON.stringify(errorData);
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
          errorDetails = errorText;
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }

      console.error("❌ Request failed:", errorMessage);
      console.error("Error details:", errorDetails);

      // Specific handling for 403 Forbidden
      if (response.status === 403) {
        console.error("🚫 403 Forbidden - This could be due to:");
        console.error("1. Invalid or expired token");
        console.error("2. Insufficient permissions");
        console.error("3. Token not being sent properly");
        console.error("4. Backend not recognizing the token format");
      }

      throw new ApiError(errorMessage, response.status);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const jsonResponse = await response.json();
      console.log("✅ Successful JSON response received");
      return jsonResponse;
    }

    if (response.status === 204) {
      console.log("✅ No content response (204)");
      return {} as T;
    }

    const textResponse = await response.text();
    console.log("✅ Text response received");
    return textResponse as unknown as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;
    console.log("=== GET REQUEST ===");
    console.log("URL:", url);

    const headers = await this.getHeaders();
    console.log("Request headers prepared");

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;
    console.log("=== POST REQUEST ===");
    console.log("URL:", url);
    console.log("Data:", data);

    const headers = await this.getHeaders();
    console.log("Request headers prepared");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;
    console.log("=== PUT REQUEST ===");
    console.log("URL:", url);

    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;
    console.log("=== DELETE REQUEST ===");
    console.log("URL:", url);

    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }
}
