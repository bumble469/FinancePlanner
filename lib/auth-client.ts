'use client';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    user?: AuthUser;
  };
  error?: string;
  errors?: Record<string, string>;
}

class AuthClient {
  private accessToken: string | null = null;
  private user: AuthUser | null = null;

  async signup(params: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
    accountName?: string;
    accountType?: 'INDIVIDUAL' | 'COMPANY';
  }): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(params),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.accessToken = data.data.accessToken;
        this.user = data.data.user || null;
      }

      return data;
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async login(params: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(params),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.accessToken = data.data.accessToken;
        this.user = data.data.user || null;
      }

      return data;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async refresh(): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.accessToken = data.data.accessToken;
        return {
          success: true,
          accessToken: data.data.accessToken,
        };
      }

      return {
        success: false,
        error: data.error,
      };
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async logout(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (data.success) {
        this.accessToken = null;
        this.user = null;
      }

      return data;
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  setUser(user: AuthUser | null) {
    this.user = user;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  async fetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      const refreshResult = await this.refresh();
      if (refreshResult.success) {
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${this.accessToken}`,
          },
          credentials: 'include',
        });
      }
    }

    return response;
  }
}

export const authClient = new AuthClient();
