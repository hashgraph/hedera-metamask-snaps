export type ISaveArgs = {
  data: unknown;
  options?: unknown;
};

export type ISaveVC = {
  vc: unknown;
  id?: string;
};

export type IDeleteArgs = {
  id: string;
  options?: unknown;
};

export type IFilterArgs = {
  filter?: {
    type: string;
    filter: unknown;
  };
};

export type IConfigureArgs = {
  accessToken: string;
};

export type IQueryResult = {
  data: unknown;
  metadata: {
    id: string;
  };
};

export abstract class AbstractDataStore {
  abstract saveVC(args: ISaveArgs): Promise<string[]>;

  abstract deleteVC(args: IDeleteArgs): Promise<boolean>;

  abstract queryVC(args: IFilterArgs): Promise<IQueryResult[]>;

  abstract clearVCs(args: IFilterArgs): Promise<boolean>;

  abstract configure?(args: IConfigureArgs): Promise<boolean>;
}
