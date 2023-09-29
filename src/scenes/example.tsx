import {
  makeScene2D,
  Circle,
  Latex,
  CubicBezier,
  Grid,
  Ray,
  Img,
} from "@motion-canvas/2d";
import { CodeBlock, insert } from "@motion-canvas/2d/lib/components/CodeBlock";
import {
  Vector2,
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  linear,
  loop,
  useScene,
  waitFor,
} from "@motion-canvas/core";

import earthGifPath from "./../../public/earth.gif";
import { RayCircle } from "../components/RayCircle";
import { SpaceGrid } from "../components/spacegrid/SpaceGrid";
import { CameraView } from "@ksassnowski/motion-canvas-camera";
import chroma from "chroma-js";

export default makeScene2D(function* (view) {
  const grid = createRef<SpaceGrid>();

  const camera = createRef<CameraView>();

  view.fill("#222");

  const circle = createRef<Img>();

  const R = 200;
  const x = 100;
  const y = 100;

  const startTime = Date.now();

  const mass = createSignal(0);

  const scene = useScene();
  const size = scene.getSize();

  const absoluteEarthPosition = new Vector2(
    (2 * x) / size.y,
    (2 * -y) / size.y
  );

  const earthX = createSignal(0);
  const earthY = createSignal(0);

  view.add(
    <SpaceGrid
      ref={grid}
      width={"100%"}
      height={"100%"}
      stroke={"#ccc"}
      lineThickness={1.2}
      gridZoom={() => camera().scale().magnitude / Math.SQRT2}
      gridCoords={
        () =>
          camera()
            .position()
            .mul(new Vector2(-2, 2))
            .div(camera().size().y)
            .addX((earthX() * camera().scale().magnitude) / Math.SQRT2)
        //.addX((Date.now() - startTime) / 1000)
      }
      color={chroma("#ccc")}
      start={0.5}
      end={0.5}
      showObjects={false}
      objects={() => [
        {
          x: absoluteEarthPosition.x + earthX(),
          y: absoluteEarthPosition.y + earthY(),
          mass: mass(),
          radius: 0.33,
        },
      ]}
    />
  );

  const raycircle = createRef<RayCircle>();

  view.add(
    <CameraView ref={camera} width={"100%"} height={"100%"}>
      <Img
        antialiased={true}
        src={earthGifPath}
        ref={circle}
        size={R}
        x={x}
        y={y}
      />
      <RayCircle ref={raycircle} x={x} y={y} radius={R}></RayCircle>
    </CameraView>
  );

  function* animation() {
    yield* camera().zoomOnto(circle(), 1.5, 1600);

    yield* mass(6, 2);

    yield* camera().zoomOnto(circle(), 1.5, 400);

    yield* raycircle().animate();
  }

  yield* all(animation(), earthX(4, 10, linear));
});
