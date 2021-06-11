export class Instance {
  id: number;
  ipAddress: string;

  constructor(data?: Partial<Instance>) {
    Object.assign(this, data);
  }
}
