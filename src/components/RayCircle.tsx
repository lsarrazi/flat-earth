import { Ray, Node, initial, NodeProps, signal } from "@motion-canvas/2d";
import {
  Reference,
  SignalValue,
  SimpleSignal,
  all,
  createRef,
  easeInOutCubic,
} from "@motion-canvas/core";

export interface RayCircleProps extends NodeProps {
  // propertie

  radius: SignalValue<number>;
}

export class RayCircle extends Node {
  protected rays: Reference<Ray>[];

  @initial(0)
  @signal()
  public radius: SimpleSignal<number, this>;

  constructor(props: RayCircleProps) {
    super(props);

    this.rays = [];

    const M = 13;

    for (let i = 0; i < M; i++) {
      const ray = createRef<Ray>();

      this.rays.push(ray);

      const length = 70;
      const pointTo = 0;

      const inbetweenCirconference = (2 * Math.PI * i) / M;

      const relativeUnitPosition = {
        x: Math.cos(inbetweenCirconference),
        y: Math.sin(inbetweenCirconference),
      };

      const position = () => {
        const position = {
          x: (-relativeUnitPosition.x * this.radius()) / 2,
          y: (-relativeUnitPosition.y * this.radius()) / 2,
        };
        return position;
      };

      this.add(
        <Ray
          ref={ray}
          lineWidth={5}
          arrowSize={12}
          endArrow
          stroke={"lightseagreen"}
          fromX={pointTo - length}
          toX={pointTo}
          end={0}
          rotation={(i * 360) / M}
          position={position}
        />
      );
    }
  }

  *animate() {
    const square = (value: number, ...args: any[]) =>
      easeInOutCubic(value ** 2, ...args);

    yield* all(...this.rays.map((ray) => ray().end(1, 1, square)));

    yield* all(...this.rays.map((ray) => ray().start(1, 1, square)));
  }
}
