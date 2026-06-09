export interface JwtPayload {
  sub: string
  username: string
}

export interface AuthenticatedRequest {
  user: {
    userId: string
    username: string
  }
}
