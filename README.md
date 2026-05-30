# FeedPets

FeedPets is a small Cocos Creator + React test project. React owns the web UI and embeds the Cocos web build in an iframe. Cocos owns the pet scene and animation logic. Both sides share event names and payload types through `shared/protocol`.

## Project Structure

```text
react-cocos-runtime-demo/
  cocos-game/       Cocos Creator project
  react-app/        React + Vite app that embeds the Cocos build
  shared/protocol/  Shared TypeScript event contract
  Texture/          Source texture assets
```

## Requirements

- Node.js
- pnpm
- Cocos Creator 3.8.8

## Environment Files

The `.env` files are intentionally not committed. Create them locally before running the project.

### `cocos-game/.env`

```env
COCOS_CLI=C:\Path\To\CocosCreator.exe
COCOS_BUILD_PATH=..\react-app\public\cocos-game
```

Notes:

- `COCOS_CLI` should point to your local Cocos Creator executable.
- `COCOS_BUILD_PATH` is where the Cocos web build will be exported.
- The React app expects the exported Cocos files to be available under `react-app/public/cocos-game/web-desktop`.

### `react-app/.env`

```env
VITE_COCOS_URL=/cocos-game/web-desktop/
```

`VITE_COCOS_URL` must point to the Cocos web build folder that React loads into the iframe.

## Install

Install dependencies in each package:

```bash
cd shared/protocol
pnpm install
pnpm build

cd ../../cocos-game
pnpm install

cd ../react-app
pnpm install
```

## Development

Build the shared protocol first:

```bash
cd shared/protocol
pnpm build
```

Build the Cocos web output:

```bash
cd ../../cocos-game
pnpm build
```

Start the React app:

```bash
cd ../react-app
pnpm dev
```

## Scripts

### `shared/protocol`

- `pnpm build` - compile shared event types into `dist`.

### `cocos-game`

- `pnpm build` - run `scripts/build-cocos.mjs` and export the Cocos web build.

### `react-app`

- `pnpm dev` - start the Vite dev server.
- `pnpm build` - type-check and build React.
- `pnpm test` - run Vitest tests.
- `pnpm lint` - run ESLint.
- `pnpm preview` - preview the production build.

## Event Bridge

The iframe bridge uses `CustomEvent` and shared constants from `@feedpets/protocol`.

- React dispatches events through `useEventBridge`.
- Cocos listens and emits events through `assets/Script/EventManager.ts`.
- Shared event names and payload types live in `shared/protocol/src`.

Current pet actions:

- `feed`
- `pet`
- `dance`

## GitHub Notes

Recommended files and folders to keep out of Git:

- `node_modules/`
- `.env`
- `react-app/dist/`
- `cocos-game/build/`
- `cocos-game/library/`
- `cocos-game/temp/`
- `cocos-game/local/`
- `cocos-game/profiles/`

For this test project, committing `react-app/public/cocos-game/web-desktop` is optional:

- Commit it if you want GitHub users to run the React app without opening Cocos Creator.
- Ignore it if you want the Cocos build to always be generated locally with `cd cocos-game && pnpm build`.

## Possible Improvements

- Rename `useGetCocosIframeSrc` to `useCocosIframeDocument` or `useCocosIframeBlobUrl`, because the hook creates an iframe HTML document and returns a blob URL.
- Consider adding `.env.example` files for `cocos-game` and `react-app` so contributors can copy the expected variables quickly.
- Consider adding a root workspace file, such as `pnpm-workspace.yaml`, if the project will keep multiple packages.
- Decide whether generated folders like `shared/protocol/dist` and `react-app/public/cocos-game/web-desktop` should be committed or rebuilt locally.
