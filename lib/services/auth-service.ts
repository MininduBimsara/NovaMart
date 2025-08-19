import type { AuthContextInterface } from "@asgardeo/auth-react"

export class AuthService {
  private authContext: AuthContextInterface

  constructor(authContext: AuthContextInterface) {
    this.authContext = authContext
  }

  async login() {
    try {
      await this.authContext.signIn()
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  async logout() {
    try {
      await this.authContext.signOut()
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await this.authContext.getAccessToken()
    } catch (error) {
      console.error("Failed to get access token:", error)
      return null
    }
  }

  getUserProfile() {
    return this.authContext.state.username
      ? {
          username: this.authContext.state.username,
          name: this.authContext.state.displayName || "",
          email: this.authContext.state.email || "",
          // Additional claims can be extracted from ID token
        }
      : null
  }

  isAuthenticated(): boolean {
    return this.authContext.state.isAuthenticated
  }

  isLoading(): boolean {
    return this.authContext.state.isLoading
  }
}
