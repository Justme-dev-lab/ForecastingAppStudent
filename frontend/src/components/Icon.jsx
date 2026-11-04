const PATHS = {
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  trend: <path d="M3 17l5-5 4 4 8-9M15 7h5v5" />,
  file: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5h.01" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  bell: <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20a2 2 0 004 0" />,
  download: <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  school: <path d="M3 10l9-6 9 6M5 10v9h14v-9M9 19v-5h6v5" />,
  out: <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9" />,
};

export default function Icon({ name, size, className = '', style }) {
  const s = size ? { width: size, height: size, ...style } : style;
  return (
    <svg className={`ico ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true" style={s}>
      {PATHS[name]}
    </svg>
  );
}
