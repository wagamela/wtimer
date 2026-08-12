const NAV_ITEMS = [
  { icon: 'bx-time-five', title: 'Timer' },
  { icon: 'bx-collection', title: 'Sessions' },
  { icon: 'bx-line-chart', title: 'Stats' },
  { icon: 'bx-cog', title: 'Settings' },
];

// Controlled by the parent now (App owns which page is active) instead of
// managing its own local state, so clicking "Stats" can actually switch
// the page.
export default function BottomNav({ active, onSelect }) {
  return (
    <div className="nav-wrapper">
      <nav className="nav">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.title}
            className={`nav-item${active === i ? ' active' : ''}`}
            title={item.title}
            onClick={() => onSelect(i)}
          >
            <i className={`bx ${item.icon}`}></i>
            <span>{item.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
