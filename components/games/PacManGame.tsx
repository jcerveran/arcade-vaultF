"use client";

// Celdas: 0 pasillo con pellet, 1 pared, 2 pasillo vacío, 3 casa de fantasmas, 4 túnel lateral.
export const CELL = 40;
export const COLS = 19;
export const ROWS = 21;

export interface Cell {
  col: number;
  row: number;
}

// Leyenda: # pared · . pellet · ' ' vacío · H casa de fantasmas · T túnel
const MAZE_ART = [
  "###################",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.### # ###.####",
  "####.#       #.####",
  "####.# ##H## #.####",
  "T   .  #HHH#  .   T",
  "####.# ##### #.####",
  "####.#       #.####",
  "####.# ##### #.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#..#..... .....#..#",
  "##.#.#.#####.#.#.##",
  "#....#...#...#....#",
  "#.######.#.######.#",
  "#.................#",
  "###################",
];

const GLYPH_TO_CELL: Record<string, number> = {
  ".": 0,
  "#": 1,
  " ": 2,
  H: 3,
  T: 4,
};

export const MAZE_LAYOUT: number[][] = MAZE_ART.map((line) =>
  Array.from(line, (ch) => GLYPH_TO_CELL[ch]),
);

export const PACMAN_START: Cell = { col: 9, row: 15 };
export const GHOST_HOUSE_DOOR: Cell = { col: 9, row: 8 };

const DIRS: Cell[] = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

/** Túnel: una celda `4` en un extremo de la fila reaparece en el extremo opuesto. */
export function wrapTunnel(position: Cell, layout: number[][]): Cell {
  if (layout[position.row]?.[position.col] !== 4) return position;
  const last = layout[position.row].length - 1;
  if (position.col === 0) return { col: last, row: position.row };
  if (position.col === last) return { col: 0, row: position.row };
  return position;
}

/** Vecino en la dirección dada; cruza el túnel si la celda actual es `4` en el borde. */
function step(from: Cell, dir: Cell, layout: number[][]): Cell | null {
  const width = layout[0].length;
  let col = from.col + dir.col;
  const row = from.row + dir.row;
  if (row < 0 || row >= layout.length) return null;
  if (col < 0 || col >= width) {
    if (layout[from.row][from.col] !== 4) return null;
    col = (col + width) % width;
  }
  return { col, row };
}

/**
 * BFS sobre el grid. Devuelve las celdas a recorrer (sin incluir `from`, incluyendo `to`),
 * `[]` si from === to y `null` si no hay ruta. La casa de fantasmas (`3`) solo se
 * atraviesa con `allowHouse` (fantasmas).
 */
export function findShortestPath(
  from: Cell,
  to: Cell,
  layout: number[][],
  allowHouse = true,
): Cell[] | null {
  const key = (c: Cell) => c.row * layout[0].length + c.col;
  if (key(from) === key(to)) return [];
  const prev = new Map<number, Cell>();
  const seen = new Set<number>([key(from)]);
  const queue: Cell[] = [from];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    for (const dir of DIRS) {
      const next = step(cur, dir, layout);
      if (!next) continue;
      const cell = layout[next.row][next.col];
      if (cell === 1 || (cell === 3 && !allowHouse)) continue;
      const k = key(next);
      if (seen.has(k)) continue;
      seen.add(k);
      prev.set(k, cur);
      if (k === key(to)) {
        const path: Cell[] = [next];
        let back = prev.get(k);
        while (back && key(back) !== key(from)) {
          path.unshift(back);
          back = prev.get(key(back));
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}
