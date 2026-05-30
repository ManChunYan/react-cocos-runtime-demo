import { _decorator, Component } from "cc";
import {
  COCOS_BRIDGE_EVENT,
  COCOS_EVENT_PROXY_ID,
  PET_GAME_EVENT,
  type PetGameEventName,
  type PetGameBridgeEvent,
  type PetGameEventPayloadMap,
} from "@feedpets/protocol";

const { ccclass } = _decorator;

type Unsubscribe = () => void;

type EventHandler<T extends PetGameEventName> = (
  payload: PetGameEventPayloadMap[T],
) => void;

@ccclass("EventManager")
export class EventManager extends Component {
  private static _instance: EventManager | null = null;

  public static get instance(): EventManager | null {
    return EventManager._instance;
  }

  private readonly eventMap = new Map<
    PetGameEventName,
    Set<EventHandler<PetGameEventName>>
  >();

  private isPrimaryInstance = false;
  private eventProxy: Element | null = null;

  protected onLoad(): void {
    if (EventManager._instance && EventManager._instance !== this) {
      console.warn(
        `[EventManager] Duplicate instance on node "${this.node.name}" was removed. Existing instance is on node "${EventManager._instance.node.name}".`,
      );

      this.enabled = false;
      this.destroy();
      return;
    }

    EventManager._instance = this;
    this.isPrimaryInstance = true;
    this.bindEventProxy();
  }

  protected onDestroy(): void {
    if (!this.isPrimaryInstance) {
      return;
    }

    if (EventManager._instance === this) {
      EventManager._instance = null;
    }

    this.clear();
    this.unbindEventProxy();
  }

  public on<T extends PetGameEventName>(
    eventName: T,
    handler: EventHandler<T>,
  ): Unsubscribe {
    let handlers = this.eventMap.get(eventName);

    if (!handlers) {
      handlers = new Set();
      this.eventMap.set(eventName, handlers);
    }

    handlers.add(handler as EventHandler<PetGameEventName>);

    return () => this.off(eventName, handler);
  }

  public once<T extends PetGameEventName>(
    eventName: T,
    handler: EventHandler<T>,
  ): Unsubscribe {
    const unsubscribe = this.on<T>(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });

    return unsubscribe;
  }

  public off<T extends PetGameEventName>(
    eventName: T,
    handler: EventHandler<T>,
  ): void {
    const handlers = this.eventMap.get(eventName);

    if (!handlers) {
      return;
    }

    handlers.delete(handler as EventHandler<PetGameEventName>);

    if (handlers.size === 0) {
      this.eventMap.delete(eventName);
    }
  }

  public emit<T extends PetGameEventName>(
    eventName: T,
    payload: PetGameEventPayloadMap[T],
  ): void {
    const handlers = this.eventMap.get(eventName);

    if (!handlers) {
      return;
    }

    Array.from(handlers).forEach((handler) => handler(payload));
  }

  public dispatchEvent<T extends PetGameEventName>(
    eventName: T,
    payload: PetGameEventPayloadMap[T],
  ): void {
    this.emit(eventName, payload);
    this.dispatchBridgeEvent(eventName, payload);
  }

  public clear(eventName?: PetGameEventName): void {
    if (eventName === undefined) {
      this.eventMap.clear();
      return;
    }

    this.eventMap.delete(eventName);
  }

  private bindEventProxy(): void {
    if (typeof document === "undefined") {
      return;
    }

    this.eventProxy = document.getElementById(COCOS_EVENT_PROXY_ID);
    this.eventProxy?.addEventListener(
      COCOS_BRIDGE_EVENT.TO_COCOS,
      this.onBridgeEvent,
    );

    if (this.eventProxy) {
      this.dispatchBridgeEvent(PET_GAME_EVENT.COCOS_READY, {});
    }
  }

  private unbindEventProxy(): void {
    this.eventProxy?.removeEventListener(
      COCOS_BRIDGE_EVENT.TO_COCOS,
      this.onBridgeEvent,
    );
    this.eventProxy = null;
  }

  private onBridgeEvent = (event: Event): void => {
    const { detail } = event as CustomEvent<PetGameBridgeEvent>;

    if (!detail?.eventName) {
      return;
    }

    this.emit(detail.eventName, detail.payload);
  };

  private dispatchBridgeEvent<T extends PetGameEventName>(
    eventName: T,
    payload: PetGameEventPayloadMap[T],
  ): void {
    this.eventProxy?.dispatchEvent(
      new CustomEvent<PetGameBridgeEvent<T>>(COCOS_BRIDGE_EVENT.FROM_COCOS, {
        detail: { eventName, payload },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

export default EventManager;
