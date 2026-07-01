/** Normalised user identity extracted from a verified Google id token. */
export interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}
