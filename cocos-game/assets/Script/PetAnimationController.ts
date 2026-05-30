import {
  _decorator,
  Animation,
  Component,
  EventKeyboard,
  input,
  Input,
  KeyCode,
} from "cc";
import {
  PET_GAME_EVENT,
  type PetAction,
  type PetActionEvent,
} from "@feedpets/protocol";
import EventManager from "./EventManager";

const { ccclass, property } = _decorator;

const ANIMATION_CLIP = {
  idle: "Idle",
  feed: "Eating",
  pet: "Petting",
  dance: "Dancing",
} as const;

@ccclass("PetAnimationController")
export class PetAnimationController extends Component {
  @property(Animation)
  private animation: Animation | null = null;

  private unsubscribeActionEvent: (() => void) | null = null;

  protected onLoad(): void {
    if (!this.animation) {
      this.animation = this.getComponent(Animation);
    }
  }

  protected start(): void {
    this.subscribeActionEvent();
    this.playIdle();
  }

  protected onEnable(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.subscribeActionEvent();
  }

  protected onDisable(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.unsubscribeActionEvent?.();
    this.unsubscribeActionEvent = null;
  }

  public playIdle(): void {
    this.play(ANIMATION_CLIP.idle);
  }

  public playAction(action: PetAction): void {
    switch (action) {
      case "feed":
        this.playOnceThenIdle(ANIMATION_CLIP.feed);
        break;
      case "pet":
        this.playOnceThenIdle(ANIMATION_CLIP.pet);
        break;
      case "dance":
        this.playOnceThenIdle(ANIMATION_CLIP.dance);
        break;
    }
  }

  private playOnceThenIdle(clipName: string): void {
    if (!this.animation) return;

    this.animation.off(
      Animation.EventType.FINISHED,
      this.onActionFinished,
      this,
    );
    this.animation.once(
      Animation.EventType.FINISHED,
      this.onActionFinished,
      this,
    );

    this.play(clipName);
  }

  private onActionFinished(): void {
    this.playIdle();
  }

  private subscribeActionEvent(): void {
    if (this.unsubscribeActionEvent) {
      return;
    }

    const eventManager = EventManager.instance;

    if (!eventManager) {
      return;
    }

    this.unsubscribeActionEvent = eventManager.on(
      PET_GAME_EVENT.ACTION,
      this.onPetAction,
    );
  }

  private onPetAction = (event: PetActionEvent): void => {
    this.playAction(event.action);
  };

  private play(clipName: string): void {
    if (!this.animation) {
      console.warn("[PetAnimationController] Missing Animation component.");
      return;
    }

    const state = this.animation.getState(clipName);

    if (!state) {
      console.warn(
        `[PetAnimationController] Missing animation clip: ${clipName}`,
      );
      return;
    }

    this.animation.play(clipName);
  }

  private onKeyDown(event: EventKeyboard): void {
    switch (event.keyCode) {
      case KeyCode.KEY_Q:
        this.playAction("feed");
        break;
      case KeyCode.KEY_W:
        this.playAction("pet");
        break;
      case KeyCode.KEY_E:
        this.playAction("dance");
        break;
    }
  }
}
