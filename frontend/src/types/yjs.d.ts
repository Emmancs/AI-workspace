declare module 'yjs' {
  export class Doc {
    constructor(initial?: unknown);
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
    destroy(): void;
  }

  export function encodeStateAsUpdate(doc: Doc): Uint8Array;
  export function applyUpdate(doc: Doc, update: Uint8Array, origin?: unknown): void;
}
