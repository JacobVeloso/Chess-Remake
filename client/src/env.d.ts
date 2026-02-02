// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_PLAYER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
