import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(rootDir, ".env");

function readEnv(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function resolveFromProject(pathValue) {
  return isAbsolute(pathValue) ? pathValue : resolve(rootDir, pathValue);
}

const env = { ...readEnv(envPath), ...process.env };
const cocosCli = env.COCOS_CLI;
const buildPath = env.COCOS_BUILD_PATH;

if (!cocosCli) {
  throw new Error("Missing COCOS_CLI in cocos-game/.env");
}

if (!buildPath) {
  throw new Error("Missing COCOS_BUILD_PATH in cocos-game/.env");
}

if (!existsSync(cocosCli)) {
  throw new Error(`COCOS_CLI does not exist: ${cocosCli}`);
}

const resolvedBuildPath = resolveFromProject(buildPath);
const platform = env.COCOS_BUILD_PLATFORM ?? "web-desktop";
const debug = env.COCOS_BUILD_DEBUG ?? "false";
const buildOptions = [
  `platform=${platform}`,
  `debug=${debug}`,
  `buildPath=${resolvedBuildPath}`,
];

await mkdir(resolvedBuildPath, { recursive: true });

console.log(`Cocos CLI: ${cocosCli}`);
console.log(`Project: ${rootDir}`);
console.log(`Build target: ${resolvedBuildPath}`);
console.log(`Platform: ${platform}`);

const child = spawn(
  cocosCli,
  ["--project", rootDir, "--build", buildOptions.join(";")],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: undefined,
    },
    stdio: "inherit",
    windowsHide: false,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Cocos build stopped by signal: ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
