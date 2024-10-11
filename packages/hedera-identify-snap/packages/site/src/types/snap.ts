export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};

export type ExternalAccountParams = {
  externalAccount: {
    blockchainType: string;
    data: {
      accountId?: string;
      address?: string;
    };
  };
};
