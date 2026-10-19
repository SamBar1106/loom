/**
 * Obviously fake preview account. Not a credential for any real service.
 * The mock accepts only this password. Nothing here is a secret.
 */
export const sampleAccount = {
  name: "Alex Sample",
  email: "alex.sample@example.com",
  password: "sample-password",
} as const;
