// Google Identity Services (GIS) types

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken(options?: { prompt?: string }): void
  callback: (response: TokenResponse) => void
}

interface TokenClientConfig {
  client_id: string
  scope: string
  callback: (response: TokenResponse) => void
  error_callback?: (error: { type: string; message: string }) => void
}

interface GoogleOAuth2 {
  initTokenClient(config: TokenClientConfig): TokenClient
  revoke(token: string, callback?: () => void): void
}

interface Google {
  accounts: {
    oauth2: GoogleOAuth2
  }
}

declare global {
  interface Window {
    google?: Google
  }
}

export {}
