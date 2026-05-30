const requireEnv = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value.endsWith("/") ? value : `${value}/`;
};

export const ENV_CONFIG = {
  cocosUrl: requireEnv("VITE_COCOS_URL", import.meta.env.VITE_COCOS_URL),
} as const;
