/**
 * Cognito PreSignUp trigger.
 *
 * Kids sign up with a username + password only — no email or phone — so there is
 * nothing to verify by message. We auto-confirm the account here so it is usable
 * the moment a parent creates it (account creation is parent-gated in the app).
 */
export const handler = async (event) => {
  event.response.autoConfirmUser = true;
  // No verified contact channels to auto-verify.
  event.response.autoVerifyEmail = false;
  event.response.autoVerifyPhone = false;
  return event;
};
