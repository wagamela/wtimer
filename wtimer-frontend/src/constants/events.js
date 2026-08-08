// Dropdown value -> full display name, grouped exactly like the original <select>
export const EVENT_OPTIONS = [
  {
    group: 'WCA Official Events',
    options: [
      { value: '333', label: '3×3×3' },
      { value: '222', label: '2×2×2' },
      { value: '444', label: '4×4×4' },
      { value: '555', label: '5×5×5' },
      { value: '666', label: '6×6×6' },
      { value: '777', label: '7×7×7' },
      { value: '333bf', label: '3×3×3 Blindfolded' },
      { value: '333fm', label: '3×3×3 Fewest Moves' },
      { value: '333oh', label: '3×3×3 One-Handed' },
      { value: '444bf', label: '4×4×4 Blindfolded' },
      { value: '555bf', label: '5×5×5 Blindfolded' },
      { value: '333mbf', label: '3×3×3 Multi-Blind' },
      { value: 'clock', label: 'Clock' },
      { value: 'minx', label: 'Megaminx' },
      { value: 'pyram', label: 'Pyraminx' },
      { value: 'skewb', label: 'Skewb' },
      { value: 'sq1', label: 'Square-1' },
    ],
  },
  {
    group: 'Unofficial Events',
    options: [
      { value: 'fto', label: 'FTO' },
      { value: 'master_tetraminx', label: 'Master Tetraminx' },
    ],
  },
];

// Short labels used in the solve list (value -> abbreviation)
export const EVENT_LABELS = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '666': '6×6', '777': '7×7', '333bf': '3BLD', '333fm': 'FMC',
  '333oh': '3OH', '444bf': '4BLD', '555bf': '5BLD', '333mbf': 'MBLD',
  'clock': 'Clock', 'minx': 'Mega', 'pyram': 'Pyra',
  'skewb': 'Skewb', 'sq1': 'SQ1', 'fto': 'FTO', 'master_tetraminx': 'MTetra',
};
