export class Instance {
  id: number;
  ipAddress: string;
  computeId: string

  constructor(data?: Partial<Instance>) {
    Object.assign(this, data);
  }
}
