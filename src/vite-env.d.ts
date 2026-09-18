/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** MapTiler API key — enables high-res satellite/hybrid imagery. Optional. */
  readonly VITE_MAPTILER_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
