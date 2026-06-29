import { useMemo } from 'react';
import { Canvas, Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import ICON_PATHS from './icon-paths.json';

// A consistent line-icon system (lucide geometry) rendered with Skia, so the app stops
// using EMOJI as UI icons (the loudest "amateur" tell). Icons are 24×24 lucide paths with
// 2px rounded strokes; tint with any theme colour. No new native dep, reuses Skia (already
// used for the charts). Keep emoji ONLY for celebratory/social moments (badges, streaks).

export type IconName = keyof typeof ICON_PATHS;

const cache = new Map<string, SkPath[]>();
function parse(name: string): SkPath[] {
  let p = cache.get(name);
  if (!p) {
    const ds = (ICON_PATHS as Record<string, string[]>)[name] ?? [];
    p = ds.map((d) => Skia.Path.MakeFromSVGString(d)).filter((x): x is SkPath => !!x);
    cache.set(name, p);
  }
  return p;
}

export function Icon({ name, size = 22, color, stroke = 2 }: { name: IconName; size?: number; color: string; stroke?: number }) {
  const paths = useMemo(() => parse(name), [name]);
  const scale = size / 24;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale }]}>
        {paths.map((p, i) => (
          <Path key={i} path={p} style="stroke" strokeWidth={stroke} strokeCap="round" strokeJoin="round" color={color} antiAlias />
        ))}
      </Group>
    </Canvas>
  );
}
