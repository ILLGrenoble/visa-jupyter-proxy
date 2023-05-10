export * from './logger'
export * from './store'

export function errMsg(error: any): string {
    if (error != null && error.message) {
        return error.message;
    }
    return error;
}