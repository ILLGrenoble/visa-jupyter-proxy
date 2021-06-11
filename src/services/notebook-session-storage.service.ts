import { InstanceNotebookSession } from '../models';
import { Store } from '../utils';

export class NotebookSessionStorageService {

  private static STORAGE_KEY = 'instanceNotebookSessions';

  constructor(private _store: Store) {
  }

  async addInstanceNotebookSessionToStorage(instanceNotebookSession: InstanceNotebookSession) {
    const instanceNotebookSessions = await this.getInstanceNotebookSessions();

    instanceNotebookSessions.push(instanceNotebookSession);
    await this._store.set(NotebookSessionStorageService.STORAGE_KEY, instanceNotebookSessions);
  }

  async removeInstanceNotebookSessionFromStorage(instanceNotebookSession: InstanceNotebookSession) {
    const instanceNotebookSessions = await this.getInstanceNotebookSessions();

    const updatedNotebookSessions = instanceNotebookSessions.filter(anInstanceNotebookSession => {
      return !(
        anInstanceNotebookSession.instanceId === instanceNotebookSession.instanceId &&
        anInstanceNotebookSession.kernel === instanceNotebookSession.kernel &&
        anInstanceNotebookSession.sessionId === instanceNotebookSession.sessionId)
    })
    await this._store.set(NotebookSessionStorageService.STORAGE_KEY, updatedNotebookSessions);
  }
  
  async eraseInstanceNotebookSessionInStorage(): Promise<InstanceNotebookSession[]> {
    const instanceNotebookSessions = await this.getInstanceNotebookSessions();
    await this._store.remove(NotebookSessionStorageService.STORAGE_KEY);

    return instanceNotebookSessions;
  }

  private async getInstanceNotebookSessions(): Promise<InstanceNotebookSession[]> {
    let instanceNotebookSessions = await this._store.get(NotebookSessionStorageService.STORAGE_KEY) as InstanceNotebookSession[];
    if (instanceNotebookSessions == null) {
      instanceNotebookSessions = [];
    }

    return instanceNotebookSessions;
  }
}