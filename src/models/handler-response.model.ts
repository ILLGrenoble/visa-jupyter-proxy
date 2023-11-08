import { Instance } from "./instance.model";

export interface HandlerResponse {
    instance: Instance,
    target: string,
}