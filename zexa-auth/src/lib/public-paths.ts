/**
 * Public paths configuration
 *
 * - exactPaths: Array of specific paths that are public (e.g., "/", "/about")
 * - prefixes: Array of path prefixes that make all their children public (e.g., "/docs/", "/api/")
 *
 * OIDC note (HUDHUD Identity phase A): the /api/oidc/ prefix is PUBLIC because the OIDC
 * spec requires discovery, authorize, token, userinfo and JWKS endpoints to be reachable
 * by relying parties without a zexa-auth session. Authorization itself still requires the
 * end-user to authenticate — public reachability is not anonymous access.
 */

export const publicPathsConfig = {
  // Exact paths that should be publicly accessible
  exactPaths: ["/", "/api/health"],

  // Path prefixes - any path starting with these will be public
  prefixes: ["/docs/", "/auth/", "/api/auth/", "/api/oidc/"],
};

export function isPublicPath(pathname: string): boolean {
  // Check exact path matches
  if (publicPathsConfig.exactPaths.includes(pathname)) {
    return true;
  }

  // Check prefix matches
  for (const prefix of publicPathsConfig.prefixes) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}
