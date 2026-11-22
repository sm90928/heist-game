// The three galleries of The Midnight Gallery. One file, one job: the maps.
// Legend: # wall, . floor, S thief start, E exit door, D small loot (gem),
// P big loot (painting, needs a short channel), C biggest loot (crown jewels).
// Guards walk the waypoint loops; cameras sit at a tile and sweep their cone.

export const LEVELS = [
  {
    name: 'The Marble Hall',
    requiredLoot: 1500,
    map: [
      '####################',
      '#S....D.........D..#',
      '#..................#',
      '#..##.....##.......#',
      '#..##..D..##.......#',
      '#..................#',
      '#..D....####.......#',
      '#.......####..D....#',
      '#..................#',
      '#..P......C........#',
      '#..................#',
      '########E###########',
    ],
    guards: [
      { waypoints: [[2, 2], [17, 2], [17, 5], [2, 5]] },
      { waypoints: [[2, 9], [17, 9], [17, 10], [2, 10]] },
    ],
    cameras: [
      { tile: [16, 4], angle: Math.PI },
      { tile: [3, 2], angle: Math.PI / 2 },
    ],
  },
  {
    name: 'The East Wing',
    requiredLoot: 2500,
    map: [
      '####################',
      '#S...D....#...D....#',
      '#.........#........#',
      '#.###.....#...##...#',
      '#.#.......D...##...#',
      '#.#..####.....#....#',
      '#....####..D.......#',
      '#.D.......#...P....#',
      '#....####.#........#',
      '#..##....#...C.....#',
      '#..................#',
      '########E###########',
    ],
    guards: [
      { waypoints: [[2, 1], [8, 1], [8, 2], [2, 2]] },
      { waypoints: [[17, 1], [17, 10], [12, 10], [12, 1]] },
      { waypoints: [[2, 10], [17, 10]] },
    ],
    cameras: [
      { tile: [18, 4], angle: Math.PI },
      { tile: [1, 7], angle: 0 },
      { tile: [11, 1], angle: Math.PI / 2 },
    ],
  },
  {
    name: 'The Vault',
    requiredLoot: 3000,
    map: [
      '####################',
      '#S..D...#..D...#...#',
      '#.......#.......#..#',
      '#.##....#.###...#..#',
      '#.#..D..#.....#.#..#',
      '#.#.....#..P..#....#',
      '#...###....###.....#',
      '#.D....#..#.....#..#',
      '#..##..#.....##..D.#',
      '#......#..C...#....#',
      '#......D...........#',
      '########E###########',
    ],
    guards: [
      { waypoints: [[2, 1], [6, 1], [6, 2], [2, 2]] },
      { waypoints: [[10, 1], [14, 1], [14, 2], [10, 2]] },
      { waypoints: [[2, 7], [6, 7], [6, 10], [2, 10]] },
      { waypoints: [[12, 7], [15, 7], [15, 10], [12, 10]] },
    ],
    cameras: [
      { tile: [18, 4], angle: Math.PI },
      { tile: [1, 5], angle: 0 },
      { tile: [10, 1], angle: Math.PI / 2 },
      { tile: [9, 9], angle: -Math.PI / 2 },
    ],
  },
];
