// lib/services/user-service.ts
import type { ApiClient } from "./api-client";

// Backend DTO interfaces matching Spring Boot DTOs
export interface UserDTO {
  id?: string;
  username: string;
  email: string;
  password?: string;
  roles?: Set<string>;
  name?: string;
  contactNumber?: string;
  country?: string;
}

export interface UserProfileResponse {
  username: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  country?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  contactNumber?: string;
  country?: string;
  roles?: string[];
}

export class UserService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async registerUser(userData: {
    username: string;
    email: string;
    password: string;
    name?: string;
    contactNumber?: string;
    country?: string;
  }): Promise<User> {
    try {
      console.log("[UserService] Registering user:", userData.email);

      const userDTO: UserDTO = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        contactNumber: userData.contactNumber,
        country: userData.country,
      };

      const registeredUser = await this.apiClient.post<UserDTO>(
        "/api/users/register",
        userDTO
      );
      console.log(
        "[UserService] User registered successfully:",
        registeredUser.email
      );

      return this.convertToUser(registeredUser);
    } catch (error) {
      console.error("Failed to register user:", error);
      throw error;
    }
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    try {
      console.log("[UserService] Fetching user profile");
      const profile = await this.apiClient.get<UserProfileResponse>(
        "/api/users/profile"
      );
      console.log("[UserService] User profile fetched successfully");
      return profile;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // Return mock profile for development
      return {
        username: "demo@example.com",
        name: "Demo User",
        email: "demo@example.com",
        contactNumber: "+94771234567",
        country: "Sri Lanka",
      };
    }
  }

  async updateUser(
    id: string,
    userData: Partial<{
      username: string;
      email: string;
      name: string;
      contactNumber: string;
      country: string;
    }>
  ): Promise<User> {
    try {
      console.log("[UserService] Updating user:", id);

      const userDTO: Partial<UserDTO> = {};
      if (userData.username) userDTO.username = userData.username;
      if (userData.email) userDTO.email = userData.email;
      if (userData.name) userDTO.name = userData.name;
      if (userData.contactNumber)
        userDTO.contactNumber = userData.contactNumber;
      if (userData.country) userDTO.country = userData.country;

      const updatedUser = await this.apiClient.put<UserDTO>(
        `/api/users/${id}`,
        userDTO
      );
      console.log("[UserService] User updated successfully");

      return this.convertToUser(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      console.log("[UserService] Deleting user:", id);
      await this.apiClient.delete(`/api/users/${id}`);
      console.log("[UserService] User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  }

  private convertToUser(dto: UserDTO): User {
    return {
      id: dto.id || "",
      username: dto.username,
      email: dto.email,
      name: dto.name,
      contactNumber: dto.contactNumber,
      country: dto.country,
      roles: dto.roles ? Array.from(dto.roles) : ["USER"],
    };
  }
}
