/* Form yang dibangun dari definisi field model (respons GET /models).
   values: { [nama_field]: string }. Field kosong tidak dikirim ke backend. */
export default function DynamicForm({ model, values, onChange, disabled }) {
  const fields = [
    ...model.numeric_fields.map(f => ({ ...f, kind: 'num' })),
    ...model.categorical_fields.map(f => ({ ...f, kind: 'cat' })),
  ];
  const groups = [];
  fields.forEach(f => {
    let g = groups.find(x => x.name === f.group);
    if (!g) groups.push(g = { name: f.group, items: [] });
    g.items.push(f);
  });
  groups.sort((a, b) => (b.items.some(f => f.required) ? 1 : 0) - (a.items.some(f => f.required) ? 1 : 0));

  return (
    <div className="stack" style={{ gap: 12 }}>
      {groups.map((g, i) => (
        <details key={g.name} className="fgroup" open={i === 0}>
          <summary>{g.name} <span className="muted" style={{ fontWeight: 500 }}>({g.items.length} field)</span></summary>
          <div className="fgrid">
            {g.items.map(f => (
              <div className="field" key={f.name}>
                <label htmlFor={`f-${f.name}`}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>
                {f.kind === 'num' ? (
                  <input id={`f-${f.name}`} type="number" step="any" inputMode="decimal" disabled={disabled}
                    required={f.required} value={values[f.name] ?? ''} placeholder={`Median ${Number(f.median).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`}
                    onChange={e => onChange(f.name, e.target.value)} />
                ) : (
                  <select id={`f-${f.name}`} disabled={disabled} value={values[f.name] ?? ''} onChange={e => onChange(f.name, e.target.value)}>
                    <option value="">(kosongkan)</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {f.kind === 'num' && <span className="muted hint">Rentang data latih {Number(f.min).toLocaleString('id-ID', { maximumFractionDigits: 2 })} sampai {Number(f.max).toLocaleString('id-ID', { maximumFractionDigits: 2 })}. Kosong = median.</span>}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
