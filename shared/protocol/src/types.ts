import { PET_GAME_EVENT } from "./events.js";

export type PetAction = "feed" | "pet" | "dance";

export interface PetActionEvent {
  action: PetAction;
}

export interface PetClickedEvent {
  affectionDelta: number;
}

export type CocosReadyEvent = Record<string, never>;

export type PetGameEventName =
  (typeof PET_GAME_EVENT)[keyof typeof PET_GAME_EVENT];

export type PetGameEventPayloadMap = {
  [PET_GAME_EVENT.ACTION]: PetActionEvent;
  [PET_GAME_EVENT.CLICKED]: PetClickedEvent;
  [PET_GAME_EVENT.COCOS_READY]: CocosReadyEvent;
};

export type PetGameBridgeEvent<T extends PetGameEventName = PetGameEventName> = {
  eventName: T;
  payload: PetGameEventPayloadMap[T];
};
