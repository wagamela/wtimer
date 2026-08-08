// Computes scrambled sticker colors for an N×N cube from a scramble string.
//
// The cube is modelled as one sticker per face-slot. Each sticker carries its
// current 3D position (centre of the facelet) and current outward normal. A
// move rotates the position AND normal of every sticker whose axis coordinate
// lies in the turned layer, which is exactly the physical behaviour of a cube
// (corner/edge stickers move with every layer they touch). Rendering a face
// then just picks, for each slot, the sticker that sits at that position with
// the matching normal.

const FACES = ['U', 'D', 'F', 'B', 'R', 'L'];

const NORMALS = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
};

const RIGHT = {
  U: [1, 0, 0],
  D: [1, 0, 0],
  F: [1, 0, 0],
  B: [-1, 0, 0],
  R: [0, 0, -1],
  L: [0, 0, 1],
};

const DOWN = {
  U: [0, 0, 1],
  D: [0, 0, -1],
  F: [0, -1, 0],
  B: [0, -1, 0],
  R: [0, -1, 0],
  L: [0, -1, 0],
};

// Face moves (clockwise, WCA). `angle` is the signed 90° rotation about the
// move's axis. Middle slices M/E/S follow L/D/F respectively.
const FACE_MOVE = {
  R: { axis: 'x', side: 1, angle: 90 },
  L: { axis: 'x', side: -1, angle: -90 },
  U: { axis: 'y', side: 1, angle: 90 },
  D: { axis: 'y', side: -1, angle: -90 },
  F: { axis: 'z', side: 1, angle: -90 },
  B: { axis: 'z', side: -1, angle: 90 },
  M: { axis: 'x', angle: -90, middle: true },
  E: { axis: 'y', angle: -90, middle: true },
  S: { axis: 'z', angle: -90, middle: true },
  x: { axis: 'x', angle: 90, all: true },
  y: { axis: 'y', angle: 90, all: true },
  z: { axis: 'z', angle: -90, all: true },
};

const COLOR_NAMES = {
  U: 'U',
  D: 'D',
  F: 'F',
  B: 'B',
  R: 'R',
  L: 'L',
};

export const STICKER_COLORS = {
  U: '#ffffff',
  D: '#ffd500',
  F: '#009e60',
  B: '#0051ba',
  R: '#c41e3a',
  L: '#ff5800',
};

const quantize = (v) => Math.round(v * 2) / 2;
const keyOf = (v) => `${quantize(v.x)},${quantize(v.y)},${quantize(v.z)}`;

function rotate(vec, axis, deg) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const { x, y, z } = vec;
  if (axis === 'x') return { x, y: y * c - z * s, z: y * s + z * c };
  if (axis === 'y') return { x: x * c + z * s, y, z: -x * s + z * c };
  return { x: x * c - y * s, y: x * s + y * c, z };
}

function faceSlotPosition(face, i, j, size) {
  const fl = (size - 1) / 2;
  const n = NORMALS[face];
  const r = RIGHT[face];
  const d = DOWN[face];
  return {
    x: n[0] * fl + r[0] * (i - fl) + d[0] * (j - fl),
    y: n[1] * fl + r[1] * (i - fl) + d[1] * (j - fl),
    z: n[2] * fl + r[2] * (i - fl) + d[2] * (j - fl),
  };
}

function buildStickers(size) {
  const stickers = [];
  for (const face of FACES) {
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const pos = faceSlotPosition(face, i, j, size);
        stickers.push({
          pos,
          normal: { x: NORMALS[face][0], y: NORMALS[face][1], z: NORMALS[face][2] },
          color: COLOR_NAMES[face],
        });
      }
    }
  }
  return stickers;
}

// Parse one token like "R", "Rw'", "3Rw", "U2", "r", "M'", "y2".
function parseMove(token) {
  const m = /^(\d*)([UDFBRLMESxyzudfbrl])(w?)(['2]*)$/.exec(token);
  if (!m) return null;
  let [, depthStr, letter, wide, suffix] = m;
  if (['u', 'd', 'f', 'b', 'r', 'l'].includes(letter)) {
    letter = letter.toUpperCase();
    wide = 'w';
  }
  const base = FACE_MOVE[letter];
  if (!base) return null;

  const depth = depthStr === '' ? 0 : Number(depthStr);

  let angle = base.angle;
  if (suffix.includes('2')) angle *= 2;
  if (suffix.includes("'")) angle *= -1;

  return { base, depth, wide, angle };
}

function layerCoordsFor(move, size) {
  const { base, depth, wide } = move;
  const fl = (size - 1) / 2;

  if (base.all) return null; // rotate everything
  if (base.middle) return new Set([0]);

  // Digit without 'w' → single inner slice at that depth.
  if (depth > 0 && !wide) {
    const coord = base.side * (fl - (depth - 1));
    return new Set([quantize(coord)]);
  }

  const count = wide ? (depth > 0 ? depth : 2) : 1;
  const set = new Set();
  for (let k = 0; k < count; k++) {
    set.add(quantize(base.side * (fl - k)));
  }
  return set;
}

export function cubeFacelets(size, scramble) {
  const stickers = buildStickers(size);

  const tokens = (scramble || '').trim().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const move = parseMove(token);
    if (!move) continue;
    const layerSet = layerCoordsFor(move, size);
    for (const sticker of stickers) {
      if (layerSet && !layerSet.has(quantize(sticker.pos[move.base.axis]))) {
        continue;
      }
      sticker.pos = rotate(sticker.pos, move.base.axis, move.angle);
      sticker.normal = rotate(sticker.normal, move.base.axis, move.angle);
    }
  }

  const byPosAndNormal = new Map();
  for (const sticker of stickers) {
    byPosAndNormal.set(
      `${keyOf(sticker.pos)}|${keyOf(sticker.normal)}`,
      sticker.color,
    );
  }

  const result = {};
  for (const face of FACES) {
    const normalKey = NORMALS[face].map(quantize).join(',');
    const grid = [];
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const pos = faceSlotPosition(face, i, j, size);
        const color =
          byPosAndNormal.get(`${keyOf(pos)}|${normalKey}`) ?? '#cccccc';
        grid.push(color);
      }
    }
    result[face] = grid;
  }
  return result;
}
