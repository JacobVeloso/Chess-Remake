// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_PLAYER: string;
  readonly VITE_FEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
