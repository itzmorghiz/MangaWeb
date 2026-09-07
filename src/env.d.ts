/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_SOURCES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
