/** When true, show 7-day OAuth testing-mode notices in the UI. */
export function isGoogleOAuthTestingMode(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_OAUTH_TESTING_MODE === "true";
}
