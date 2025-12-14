export type Log = {
  id: string;
  message: string;
  level: string;
  createdAt: Date;
  index?: number;
  sequenceNumber?: number;
};
