interface Point {
  x: number;
  y: number;
}

interface SineWaveCalculationResult {
  sinePoints: string[];
  fillPathAboveLeft: string;
  fillPathAboveRight: string;
  fillPathBelowLeft: string;
  fillPathBelowRight: string;
  hour4pm: number;
  midLine: number;
  chartHeight: number;
}

export function calculateSineWavePaths(
  width: number,
  height: number,
  labelHeight: number = 20
): SineWaveCalculationResult {
  const chartHeight = height - labelHeight;
  const hourWidth = width / 24; // Each hour takes 1/24 of the width
  const hour4pm = 16 * hourWidth; // 4pm is hour 16 (0-based: 0=midnight, 16=4pm)

  const sinePoints: string[] = [];
  const abovePointsLeft: Point[] = [];
  const abovePointsRight: Point[] = [];
  const belowPointsLeft: Point[] = [];
  const belowPointsRight: Point[] = [];
  const numPoints = 100;
  const amplitude = chartHeight / 2;
  const frequency = 1;
  const midLine = chartHeight / 2;

  for (let i = 0; i <= numPoints; i++) {
    const x = (width * i) / numPoints;
    const y = chartHeight / 2 + amplitude * Math.cos((2 * Math.PI * frequency * i) / numPoints);

    sinePoints.push(`${x},${y}`);

    if (x <= hour4pm) {
      // Left side (off-peak)
      if (y < midLine) {
        abovePointsLeft.push({ x, y });
      } else {
        belowPointsLeft.push({ x, y });
      }
    } else {
      // Right side (peak)
      if (y < midLine) {
        abovePointsRight.push({ x, y });
      } else {
        belowPointsRight.push({ x, y });
      }
    }
  }

  // Build fill paths for above areas
  let fillPathAboveLeft = '';
  if (abovePointsLeft.length > 0) {
    const points = abovePointsLeft.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathAboveLeft = `M ${abovePointsLeft[0]?.x},${midLine} L ${points} L ${abovePointsLeft[abovePointsLeft.length - 1]?.x},${midLine} Z`;
  }

  let fillPathAboveRight = '';
  if (abovePointsRight.length > 0) {
    const points = abovePointsRight.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathAboveRight = `M ${abovePointsRight[0]?.x},${midLine} L ${points} L ${abovePointsRight[abovePointsRight.length - 1]?.x},${midLine} Z`;
  }

  // Build fill paths for below areas
  let fillPathBelowLeft = '';
  if (belowPointsLeft.length > 0) {
    const points = belowPointsLeft.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathBelowLeft = `M ${belowPointsLeft[0]?.x},${midLine} L ${points} L ${belowPointsLeft[belowPointsLeft.length - 1]?.x},${midLine} Z`;
  }

  let fillPathBelowRight = '';
  if (belowPointsRight.length > 0) {
    const points = belowPointsRight.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathBelowRight = `M ${belowPointsRight[0]?.x},${midLine} L ${points} L ${belowPointsRight[belowPointsRight.length - 1]?.x},${midLine} Z`;
  }

  return {
    sinePoints,
    fillPathAboveLeft,
    fillPathAboveRight,
    fillPathBelowLeft,
    fillPathBelowRight,
    hour4pm,
    midLine,
    chartHeight,
  };
}
