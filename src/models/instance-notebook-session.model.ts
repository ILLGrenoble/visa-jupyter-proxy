export class InstanceNotebookSession {
  constructor(public instanceId: number, public kernel: string, public sessionId: string) {
  }
}
