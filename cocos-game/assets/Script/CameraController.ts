import { _decorator, Camera, Component, screen, view } from "cc";
const { ccclass, property } = _decorator;

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const DESIGN_ASPECT = DESIGN_WIDTH / DESIGN_HEIGHT;

@ccclass("CameraController")
export class CameraController extends Component {
  @property({ type: Camera })
  private camera: Camera | null = null;

  private lastWidth = 0;
  private lastHeight = 0;
  private isRefreshScheduled = false;

  protected onLoad(): void {
    if (!this.camera) {
      this.camera = this.getComponent(Camera);
    }
  }

  protected onEnable(): void {
    view.on("canvas-resize", this.updateCameraSize, this);
    view.on("design-resolution-changed", this.updateCameraSize, this);
    this.updateCameraSize();
  }

  protected onDisable(): void {
    view.off("canvas-resize", this.updateCameraSize, this);
    view.off("design-resolution-changed", this.updateCameraSize, this);
    this.unschedule(this.refreshCameraSize);
    this.isRefreshScheduled = false;
  }

  protected update(): void {
    const windowSize = screen.windowSize;

    if (
      windowSize.width === this.lastWidth &&
      windowSize.height === this.lastHeight
    ) {
      return;
    }

    this.updateCameraSize();
  }

  private updateCameraSize(): void {
    this.applyCameraSize();

    if (this.isRefreshScheduled) {
      return;
    }

    this.isRefreshScheduled = true;
    this.scheduleOnce(this.refreshCameraSize, 0);
  }

  private refreshCameraSize(): void {
    this.isRefreshScheduled = false;
    this.applyCameraSize();
  }

  private applyCameraSize(): void {
    if (!this.camera) {
      return;
    }

    const windowSize = screen.windowSize;
    const aspect = windowSize.width / windowSize.height;

    if (aspect <= 0) {
      return;
    }

    this.lastWidth = windowSize.width;
    this.lastHeight = windowSize.height;
    this.camera.orthoHeight =
      aspect >= DESIGN_ASPECT ? DESIGN_HEIGHT / 2 : DESIGN_WIDTH / aspect / 2;
  }
}
