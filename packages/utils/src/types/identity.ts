export interface UserIdentity {
  username: string;
  hexpub: string;
  npub: string;
  privateKey: string;
  isReady: boolean;
}

export const defaultIdentity: UserIdentity = {
  username: '',
  hexpub: '',
  privateKey: '',
  npub: '',
  isReady: false,
};
