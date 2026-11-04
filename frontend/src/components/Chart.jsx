import { fmt } from '../lib/data.js';

/* Grafik garis NUM per tahun + titik prediksi dan kisaran kasar (SVG, tanpa library). */
export default function Chart({ years, series, f }) {
  const all = years.map(y => series[y]).concat([f.low, f.high]);
  const lo0 = Math.min(...all) - 1, hi0 = Math.max(...all) + 1;
  const step = [2, 4, 5, 10].find(s => (hi0 - lo0) / s <= 6) || 10;
  const lo = Math.floor(lo0 / step) * step, hi = Math.ceil(hi0 / step) * step;
  const X0 = 56, X1 = 616, Y0 = 240, Y1 = 20, n = years.length + 1;
  const x = i => X0 + (X1 - X0) * i / (n - 1);
  const y = v => Y0 - (Y0 - Y1) * (v - lo) / (hi - lo);
  const ticks = [];
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(t);

  const pts = years.map((yr, i) => [x(i), y(series[yr])]);
  const lastP = pts[pts.length - 1];
  const px = x(n - 1), py = y(f.value);
  const font = { fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' };

  return (
    <svg className="chart" viewBox="0 0 680 290" role="img"
      aria-label={`Grafik garis NUM sekolah ${years[0]} sampai ${years[years.length - 1]}, dengan prediksi ${f.year} sebesar ${fmt(f.value)} dan kisaran kasar ${fmt(f.low)} sampai ${fmt(f.high)}`}>
      <g stroke="#e3e2e9">{ticks.map(t => <line key={t} x1={X0} y1={y(t)} x2={660} y2={y(t)} />)}</g>
      <g fill="#565e66" fontSize="12" style={font} textAnchor="end">{ticks.map(t => <text key={t} x={46} y={y(t) + 4}>{t}</text>)}</g>
      <g fill="#565e66" fontSize="12" style={font} textAnchor="middle">
        {years.map((yr, i) => <text key={yr} x={x(i)} y={266}>{yr}</text>)}
        <text x={px} y={266} fontWeight="700" fill="#9a3412">{f.year}</text>
      </g>
      <rect x={px - 18} y={y(f.high)} width={36} height={y(f.low) - y(f.high)} rx={4} fill="#f6d7c6" />
      <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#007bb9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={lastP[0]} y1={lastP[1]} x2={px} y2={py} stroke="#c2410c" strokeWidth="2.5" strokeDasharray="6 6" />
      <g fill="#fff" stroke="#007bb9" strokeWidth="2.5">{pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={5} />)}</g>
      <circle cx={px} cy={py} r={6} fill="#fff" stroke="#c2410c" strokeWidth="3" />
      <text x={px} y={py - 15} textAnchor="middle" fontSize="13" fontWeight="700" fill="#9a3412" style={font}>{fmt(f.value)}</text>
    </svg>
  );
}
