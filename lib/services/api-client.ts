// lib/services/api-client.ts
import type { AuthService } from "./auth-service";
import { ApiError } from "@/lib/utils/error-handler";

export class ApiClient {
  private baseURL: string;
  private authService: AuthService;

  constructor(baseURL: string, authService: AuthService) {
    // Ensure consistent base URL handling
    this.baseURL = baseURL.replace(/\/+$/, ""); // Remove trailing slashes
    this.authService = authService;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.authService.isAuthenticated()) {
      const token = await this.authService.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch {
        // If parsing fails, use default message
      }

      throw new ApiError(errorMessage, response.status);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.text() as unknown as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: await this.getHeaders(),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;

    const response = await fetch(url, {
      method: "PUT",
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: await this.getHeaders(),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }
}
