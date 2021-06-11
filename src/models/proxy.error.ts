export class ProxyError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}