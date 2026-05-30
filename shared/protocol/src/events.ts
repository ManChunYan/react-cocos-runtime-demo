export const PET_GAME_EVENT = {
  ACTION: "pet-game:action",
  CLICKED: "pet-game:clicked",
  COCOS_READY: "cocos:ready",
} as const;

export const COCOS_EVENT_PROXY_ID = "EventProxy";

export const COCOS_BRIDGE_EVENT = {
  TO_COCOS: "feedpets:to-cocos",
  FROM_COCOS: "feedpets:from-cocos",
} as const;
