import { Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';

const SCREEN = Dimensions.get('window').width;
// Default width = screen minus screen padding (24*2) minus card padding (16*2).
export const CHART_W = Math.min(SCREEN, 393) - 24 * 2 - 16 * 2;

function alpha(color: string, hex2: string): string {
  return color.length === 7 ? color + hex2 : color;
}

function buildLine(data: number[], w: number, h: number, pad: number, lo: number, hi: number) {
  const span = hi - lo || 1;
  const X = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, data.length - 1);
  const Y = (v: number) => h - pad - ((v - lo) * (h - 2 * pad)) / span;
  let d = `M${X(0)} ${Y(data[0])}`;
  for (let i = 1; i < data.length; i++) d += ` L${X(i)} ${Y(data[i])}`;
  return { d, X, Y };
}

export function LineChart({
  data,
  baseline,
  color,
  width = CHART_W,
  height = 110,
}: {
  data: number[];
  baseline?: number;
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const pad = 8;
  const lo = Math.min(...data, baseline ?? Infinity) - 3;
  const hi = Math.max(...data, baseline ?? -Infinity) + 3;
  const { d, X, Y } = buildLine(data, width, height, pad, lo, hi);
  const line = Skia.Path.MakeFromSVGString(d);
  const area = Skia.Path.MakeFromSVGString(
    `${d} L${X(data.length - 1)} ${height - 2} L${X(0)} ${height - 2} Z`,
  );
  const baseY = baseline != null ? Y(baseline) : 0;
  const baseLine =
    baseline != null ? Skia.Path.MakeFromSVGString(`M${pad} ${baseY} L${width - pad} ${baseY}`) : null;
  if (!line || !area) return null;
  return (
    <Canvas style={{ width, height }}>
      <Path path={area}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[alpha(color, '47'), alpha(color, '00')]}
        />
      </Path>
      {baseLine && (
        <Path path={baseLine} color="#A99E8A" style="stroke" strokeWidth={1.5}>
          <DashPathEffect intervals={[4, 5]} />
        </Path>
      )}
      <Path path={line} color={color} style="stroke" strokeWidth={3} strokeJoin="round" strokeCap="round" />
      <Circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r={5} color={color} />
    </Canvas>
  );
}

export function BarChart({
  data,
  goal,
  color,
  muted = '#CFC5B2',
  width = CHART_W,
  height = 110,
}: {
  data: number[];
  goal?: number;
  color: string;
  muted?: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const pad = 8;
  const max = (Math.max(...data, goal ?? 0) || 1) * 1.06;
  const step = (width - 2 * pad) / data.length;
  const bw = Math.max(3, step - 3);
  const goalY = goal != null ? height - pad - (goal / max) * (height - 2 * pad) : 0;
  const goalLine =
    goal != null ? Skia.Path.MakeFromSVGString(`M${pad} ${goalY} L${width - pad} ${goalY}`) : null;
  return (
    <Canvas style={{ width, height }}>
      {data.map((v, i) => {
        const bh = (v / max) * (height - 2 * pad);
        return (
          <RoundedRect
            key={i}
            x={pad + i * step}
            y={height - pad - bh}
            width={bw}
            height={bh}
            r={3}
            color={i === data.length - 1 ? color : muted}
          />
        );
      })}
      {goalLine && (
        <Path path={goalLine} color="#A99E8A" style="stroke" strokeWidth={1.5}>
          <DashPathEffect intervals={[4, 5]} />
        </Path>
      )}
    </Canvas>
  );
}

export function Sparkline({
  data,
  color,
  width = 120,
  height = 40,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const pad = 4;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const { d, X, Y } = buildLine(data, width, height, pad, lo, hi === lo ? lo + 1 : hi);
  const line = Skia.Path.MakeFromSVGString(d);
  if (!line) return null;
  return (
    <Canvas style={{ width, height }}>
      <Path path={line} color={color} style="stroke" strokeWidth={2.5} strokeJoin="round" strokeCap="round" />
      <Circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r={3.5} color={color} />
    </Canvas>
  );
}

/** Body-battery style energy curve: charge overnight, drain through the day. */
export function EnergyCurve({ color, width = CHART_W, height = 64 }: { color: string; width?: number; height?: number }) {
  const data = [28, 34, 52, 68, 80, 88, 84, 72, 60, 52, 46, 40, 38];
  const pad = 4;
  const { d, X, Y } = buildLine(data, width, height, pad, 0, 100);
  const line = Skia.Path.MakeFromSVGString(d);
  const area = Skia.Path.MakeFromSVGString(
    `${d} L${X(data.length - 1)} ${height} L${X(0)} ${height} Z`,
  );
  if (!line || !area) return null;
  return (
    <Canvas style={{ width, height }}>
      <Path path={area}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[alpha(color, '4D'), alpha(color, '00')]} />
      </Path>
      <Path path={line} color={color} style="stroke" strokeWidth={3} strokeJoin="round" strokeCap="round" />
      <Circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r={4.5} color={color} />
    </Canvas>
  );
}
