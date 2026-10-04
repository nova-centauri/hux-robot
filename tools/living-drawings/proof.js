/* Active planning view. Kinematic/load estimates only; no dynamics simulation. */
(function () {
  "use strict";
  const {model: c, results: r} = window.HuxProof;
  const g = c.geometry;
  const byId = id => document.getElementById(id);
  const write = (id, value) => { if (byId(id)) byId(id).textContent = value; };
  const money = value => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0}).format(value);
  write("total-budget", money(r.total_cap_usd));
  write("target-mass", `${c.limits.mass_target_kg.toFixed(1)} kg`);
  write("axis-count", r.actuator_count);
  write("height-travel", `${r.height_travel_mm.toFixed(0)} mm`);
  write("parts-total", money(r.parts_cap_usd));
  write("reserve-total", money(c.budget.shipping_tax_usd + c.budget.repair_contingency_usd));
  const table = byId("budget-rows");
  function budgetRow(label, amount) {
    if (!table) return;
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    const cost = document.createElement("td");
    name.textContent = label; cost.textContent = money(amount);
    tr.append(name, cost); table.append(tr);
  }
  c.budget.rows.forEach(row => budgetRow(`${row.qty > 1 ? row.qty + " × " : ""}${row.item}`, row.qty * row.unit_cap_usd));
  budgetRow("Shipping, tax and import allowance", c.budget.shipping_tax_usd);
  budgetRow("Repairs and overrun reserve", c.budget.repair_contingency_usd);
  write("budget-sum", money(r.total_cap_usd));

  const angle = byId("leg-angle"), mass = byId("mass");
  if (!angle || !mass || !byId("proof-drawing")) return;
  angle.min = g.leg_angle_deg[0]; angle.max = g.leg_angle_deg[1]; angle.value = g.neutral_angle_deg;
  mass.value = c.limits.mass_target_kg; mass.max = c.limits.mass_max_kg;
  function draw() {
    const q = Number(angle.value), m = Number(mass.value), a = q * Math.PI / 180;
    const drop = g.link_length_mm * Math.cos(a), rear = g.link_length_mm * Math.sin(a);
    const radius = g.wheel_diameter_mm / 2, hipZ = radius + drop;
    const height = hipZ + g.body_above_lower_pivot_mm;
    const torque = m * 9.81 * c.leg_screen.worst_two_wheel_load_share * g.link_length_mm / 1000 * Math.sin(a) / (g.leg_reduction * g.transmission_efficiency_assumed);
    byId("angle-value").value = `${q}°`; byId("mass-value").value = `${m.toFixed(1)} kg`;
    byId("read-height").textContent = `${height.toFixed(0)} mm`;
    byId("read-offset").textContent = `${rear.toFixed(1)} mm`;
    byId("read-torque").textContent = `${torque.toFixed(2)} N·m`;
    byId("read-travel").textContent = `${((q - g.neutral_angle_deg) * g.leg_reduction).toFixed(0)}°`;
    const ground = 352, hipX = 256, y = z => ground - z;
    const axleX = hipX - rear, pivotGap = g.pivot_separation_mm;
    const frontX = 555, left = frontX - g.wheel_track_mm / 2, right = frontX + g.wheel_track_mm / 2;
    byId("proof-drawing").innerHTML = `
      <title>V1-PROOF at ${q} degree leg angle</title>
      <desc>Upright kinematic envelope: ${height.toFixed(0)} millimetres high, ${r.overall_width_mm} millimetres wide. Two parallel links on each side. No balance simulation.</desc>
      <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e8ece3" stroke-width="0.65"/></pattern></defs>
      <rect x="0" y="40" width="740" height="325" fill="url(#grid)"/>
      <g font-family="system-ui,sans-serif" font-size="11" fill="#637469" letter-spacing="1.4"><text x="30" y="25">SIDE / PARALLEL LINK</text><text x="430" y="25">FRONT / TWO CONTACTS</text></g>
      <path d="M30 ${ground}H352 M417 ${ground}H713" stroke="#899b8d"/>
      <rect x="${hipX-115}" y="${y(height)}" width="${g.body_depth_mm}" height="${g.body_above_lower_pivot_mm}" rx="7" fill="#e0eadf" stroke="#2a6651" stroke-width="2"/>
      <rect x="${hipX-95}" y="${y(hipZ+80)}" width="64" height="35" rx="4" fill="#abc4ad"/>
      <text x="${hipX-87}" y="${y(hipZ+58)}" font-size="9" fill="#32563d">BATTERY</text>
      <path d="M${hipX} ${y(hipZ)}L${axleX} ${y(radius)}L${axleX} ${y(radius+pivotGap)}L${hipX} ${y(hipZ+pivotGap)}Z" stroke="#306c55" stroke-width="5" fill="none" stroke-linejoin="round"/>
      <circle cx="${axleX}" cy="${y(radius)}" r="${radius}" fill="#263d34"/>
      <circle cx="${axleX}" cy="${y(radius)}" r="30" fill="#d1dccc"/>
      <circle cx="${axleX}" cy="${y(radius)}" r="5" fill="#263d34"/>
      <circle cx="${hipX}" cy="${y(hipZ)}" r="13" fill="#cf946c" stroke="#885b3c" stroke-width="2"/>
      <circle cx="${hipX}" cy="${y(hipZ+pivotGap)}" r="5" fill="#cf946c"/>
      <path d="M321 ${y(height)}V${ground} M315 ${y(height)}H327 M315 ${ground}H327" stroke="#a65b36" fill="none"/>
      <text x="328" y="${y(height/2)}" font-size="11" fill="#9b502e">${height.toFixed(0)}</text>
      <rect x="${frontX-g.body_width_mm/2}" y="${y(height)}" width="${g.body_width_mm}" height="${g.body_above_lower_pivot_mm}" rx="7" fill="#e0eadf" stroke="#2a6651" stroke-width="2"/>
      <path d="M${frontX-g.body_width_mm/2} ${y(hipZ)}H${left}V${y(radius)} M${frontX+g.body_width_mm/2} ${y(hipZ)}H${right}V${y(radius)}" stroke="#306c55" stroke-width="5" fill="none"/>
      <rect x="${left-g.wheel_width_mm/2}" y="${y(2*radius)}" width="${g.wheel_width_mm}" height="${2*radius}" rx="6" fill="#263d34"/>
      <rect x="${right-g.wheel_width_mm/2}" y="${y(2*radius)}" width="${g.wheel_width_mm}" height="${2*radius}" rx="6" fill="#263d34"/>
      <path d="M${left-g.wheel_width_mm/2} 374H${right+g.wheel_width_mm/2}" stroke="#a65b36"/>
      <text x="${frontX}" y="396" font-size="11" text-anchor="middle" fill="#9b502e">${r.overall_width_mm} mm outside width</text>
      <text x="30" y="396" font-size="11" fill="#637469">Motor packages, bearings and wires need detailed fit.</text>`;
  }
  angle.addEventListener("input", draw); mass.addEventListener("input", draw); draw();
})();
