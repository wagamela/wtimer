import { useMemo } from 'react';
import { cubeFacelets, STICKER_COLORS } from '../utils/cubeState.js';

// Event codes whose scramble is an N×N cube, with the cube size. BLD / OH /
// FMC / multiblind reuse their base cube.
const EVENT_CUBE_SIZE = {
  '333': 3,
  '222': 2,
  '444': 4,
  '555': 5,
  '666': 6,
  '777': 7,
  '333bf': 3,
  '333fm': 3,
  '333oh': 3,
  '444bf': 4,
  '555bf': 5,
  '333mbf': 3,
};

const LOADING_PLACEHOLDER = 'Loading…';
const ERROR_PLACEHOLDER = 'Could not generate scramble.';

// Flat 2D net layout: each face occupies (col, row) in a grid of N×N cells.
const NET_LAYOUT = {
  B: [1, 0],
  U: [1, 1],
  L: [0, 2],
  F: [1, 2],
  R: [2, 2],
  D: [1, 3],
};

export default function CubeVisual({ event, scramble }) {
  const size = EVENT_CUBE_SIZE[event];

  const facelets = useMemo(() => {
    if (!size) return null;
    if (
      !scramble ||
      scramble === LOADING_PLACEHOLDER ||
      scramble === ERROR_PLACEHOLDER
    ) {
      return null;
    }
    try {
      return cubeFacelets(size, scramble);
    } catch {
      return null;
    }
  }, [size, scramble]);

  if (!facelets) {
    return (
      <div className="cube-visual">
        <div className="cube-visual-placeholder">
          <i className="bx bx-cube-alt"></i>
        </div>
      </div>
    );
  }

  const cell = Math.min(
    Math.floor(180 / (3 * size)),
    Math.floor(240 / (4 * size)),
  );
  const width = 3 * size * cell;
  const height = 4 * size * cell;

  return (
    <div className="cube-visual">
      <svg
        className="cube-net"
        viewBox={`0 0 ${height} ${width}`}
        width={height}
        height={width}
        role="img"
        aria-label={`Scrambled ${size}×${size} cube`}
      >
        <g transform={`translate(${height},0) rotate(90)`}>
          {Object.entries(NET_LAYOUT).map(([face, [col, row]]) =>
            facelets[face].map((colorName, k) => {
              const i = k % size;
              const j = Math.floor(k / size);
              return (
                <rect
                  key={`${face}-${k}`}
                  x={col * size * cell + i * cell}
                  y={row * size * cell + j * cell}
                  width={cell}
                  height={cell}
                  fill={STICKER_COLORS[colorName] ?? '#cccccc'}
                />
              );
            }),
          )}
        </g>
      </svg>
    </div>
  );
}