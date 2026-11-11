// ---------------------------------------------------------------------------
// Data-access provider. The whole app imports the `api` singleton from here and
// never touches localStorage or fetch directly. Which adapter backs it is a
// build-time config choice, so moving from the browser-only prototype to the
// deployed FastAPI backend is a config flip, not a code change:
//
//   VITE_API_MODE=local  (default) -> LocalAdapter  (versioned localStorage)
//   VITE_API_MODE=rest             -> RestAdapter   (Cognito-authed /api/*)
//
// Default stays `local` so the current demo is byte-for-byte unchanged until the
// backend exists and an environment explicitly opts into `rest`.
// ---------------------------------------------------------------------------

import type { Api } from './ports';
import { localAdapter } from './LocalAdapter';
import { restAdapter } from './RestAdapter';

export type ApiMode = 'local' | 'rest';

export const API_MODE: ApiMode =
  import.meta.env.VITE_API_MODE === 'rest' ? 'rest' : 'local';

export const api: Api = API_MODE === 'rest' ? restAdapter : localAdapter;

export type { Api, Doc } from './ports';
