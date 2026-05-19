export function convexHull(points: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> {
  if (points.length < 3) return [...points];

  const pts = points.map((p, i) => ({ ...p, i }));
  let lowest = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].lng < pts[lowest].lng || (pts[i].lng === pts[lowest].lng && pts[i].lat < pts[lowest].lat)) {
      lowest = i;
    }
  }
  [pts[0], pts[lowest]] = [pts[lowest], pts[0]];

  const pivot = pts[0];

  function cross(o: typeof pivot, a: typeof pivot, b: typeof pivot): number {
    return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
  }

  const sorted = pts.slice(1).sort((a, b) => {
    const c = cross(pivot, a, b);
    if (c === 0) {
      const dA = (a.lng - pivot.lng) ** 2 + (a.lat - pivot.lat) ** 2;
      const dB = (b.lng - pivot.lng) ** 2 + (b.lat - pivot.lat) ** 2;
      return dA - dB;
    }
    return c > 0 ? -1 : 1;
  });

  const hull: typeof pts = [pivot];
  for (const p of sorted) {
    while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
      hull.pop();
    }
    hull.push(p);
  }

  return hull.map(({ lat, lng }) => ({ lat, lng }));
}

export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonCenter(polygon: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (polygon.length === 0) return { lat: 0, lng: 0 };
  if (polygon.length === 1) return { lat: polygon[0].lat, lng: polygon[0].lng };
  if (polygon.length === 2) return { lat: (polygon[0].lat + polygon[1].lat) / 2, lng: (polygon[0].lng + polygon[1].lng) / 2 };

  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const f = xi * yj - xj * yi;
    area += f;
    cx += (xi + xj) * f;
    cy += (yi + yj) * f;
  }
  area *= 3;
  if (Math.abs(area) < 1e-12) {
    const sumLat = polygon.reduce((s, p) => s + p.lat, 0);
    const sumLng = polygon.reduce((s, p) => s + p.lng, 0);
    return { lat: sumLat / n, lng: sumLng / n };
  }
  return { lat: cy / area, lng: cx / area };
}
