/**
 * draco3d.d.ts — minimal ambient type declaration for the `draco3d` npm package.
 * The package ships no TypeScript types; this stub covers the subset used in
 * build-cinematic-assets.ts (the encoder module factory).
 */

declare module 'draco3d' {
  interface DracoEncoderModule {
    // The actual module is a WASM/emscripten object — we only need
    // to pass it to gltf-transform's registerDependencies.
    [key: string]: unknown;
  }

  export function createEncoderModule(options?: object): Promise<DracoEncoderModule>;
  export function createDecoderModule(options?: object): Promise<DracoEncoderModule>;
}
