import {
  GridProps,
  Shape,
  initial,
  signal,
  useScene2D,
  vector2Signal,
} from "@motion-canvas/2d";
import {
  Color,
  PossibleVector2,
  SignalValue,
  SimpleSignal,
  Vector2Signal,
  map,
  usePlayback,
  useScene,
  useTime,
} from "@motion-canvas/core";
import chroma from "chroma-js";
import { ShaderCanvas, UniformValue } from "shader-canvas";

import gridShader from "./shader.frag?raw";

type SpaceGridObject = { x: number; y: number; mass: number; radius: number };

export interface SpaceGridProps extends GridProps {
  /**
   * {@inheritDoc Grid.spacing}
   */
  gridZoom?: SignalValue<number>;
  /**
   * {@inheritDoc Grid.start}
   */
  gridCoords?: SignalValue<PossibleVector2>;

  lineThickness?: SignalValue<number>;

  objects?: SignalValue<Array<SpaceGridObject>>;

  showObjects?: SignalValue<boolean>;

  color?: SignalValue<Color>;
}

export class SpaceGrid extends Shape {
  protected shaderCanvas;

  protected shaderHeaderCache: string;
  /**
   * The spacing between the grid lines.
   */
  @initial(80)
  @vector2Signal("spacing")
  public declare readonly spacing: Vector2Signal<this>;

  @initial(0)
  @vector2Signal("gridCoords")
  public declare readonly gridCoords: Vector2Signal<this>;

  @initial(1)
  @signal()
  public declare readonly lineThickness: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  public declare readonly gridZoom: SimpleSignal<number, this>;

  @initial(chroma("#ccc"))
  @signal()
  public declare readonly color: SimpleSignal<Color, this>;

  @initial([])
  @signal()
  public declare readonly objects: SimpleSignal<Array<SpaceGridObject>, this>;

  @initial(true)
  @signal()
  public declare readonly showObjects: SimpleSignal<boolean, this>;

  /**
   * The percentage that should be clipped from the beginning of each grid line.
   *
   * @remarks
   * The portion of each grid line that comes before the given percentage will
   * be made invisible.
   *
   * This property is useful for animating the grid appearing on-screen.
   */
  @initial(0)
  @signal()
  public declare readonly start: SimpleSignal<number, this>;

  /**
   * The percentage that should be clipped from the end of each grid line.
   *
   * @remarks
   * The portion of each grid line that comes after the given percentage will
   * be made invisible.
   *
   * This property is useful for animating the grid appearing on-screen.
   */
  @initial(1)
  @signal()
  public declare readonly end: SimpleSignal<number, this>;

  public constructor(props: SpaceGridProps) {
    super(props);

    this.shaderCanvas = new ShaderCanvas();

    const { shaderCanvas } = this;

    shaderCanvas.domElement
      .getContext("webgl")
      .getExtension("OES_standard_derivatives");

    this.buildShader();
  }

  protected buildShader() {
    const { shaderCanvas } = this;

    const objectsCount = this.objects().length;

    const shaderHeader = `
    #define OBJECTS_COUNT ${objectsCount}
    ${this.showObjects() ? "#define DRAW_OBJECTS_DEBUG" : ""}
    `;

    if (this.shaderHeaderCache === shaderHeader) {
      return;
    }
    this.shaderHeaderCache = shaderHeader;

    const shader = gridShader;

    const errorMessages = shaderCanvas.setShader(shaderHeader + shader);

    if (errorMessages && errorMessages.length > 0) {
      console.error(errorMessages);
      throw new Error(
        "GLSL errors occured:\n" + errorMessages.map((e) => e.text).join("\n")
      );
    }
  }

  protected override drawShape(context: CanvasRenderingContext2D) {
    context.save();

    const { shaderCanvas } = this;

    this.buildShader();

    const objects = this.objects();

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];

      shaderCanvas.setUniform(`objects[${i}]`, [
        object.x,
        object.y,
        object.mass,
        object.radius,
      ]);
    }

    const time = usePlayback().time;

    const width = this.width();

    const height = this.height();

    shaderCanvas.setSize(width, height);

    shaderCanvas.setUniform("uResolution", [
      width * window.devicePixelRatio,
      height * window.devicePixelRatio,
      0,
    ]);
    // shaderCanvas.setUniform("uTime", time);
    shaderCanvas.setUniform("uPosition", [
      this.gridCoords().x,
      this.gridCoords().y,
    ]);

    shaderCanvas.setUniform(
      "uColor",
      this.color()
        .rgba()
        .map((c) => c / 255) as UniformValue
    );

    shaderCanvas.setUniform("uLineThinness", 1 / (2 * this.lineThickness()));

    console.log("this.gridZoom()", this.objects());
    shaderCanvas.setUniform("uUnzoom", 1 / this.gridZoom());
    shaderCanvas.render();

    context.drawImage(
      shaderCanvas.domElement,
      this.x() - this.width() / 2,
      this.y() - this.height() / 2
    );
  }
}
