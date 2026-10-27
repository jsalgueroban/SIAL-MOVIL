// Escenarios ilustrativos de HU1920. No provienen del estado local de otros flujos móviles.
export const controlCases = [
  {
    id: "PED-2026-11021", pedido: "PED-2026-11021", line: "01", document: "RPT-2026-0921", order: "OTI-2026-041", delivery: "ENT-2026-041", pod: "POD-2026-041",
    farm: "Finca Santa Isabel", notice: "AC-2026-032", noticeVersion: "v2", materialCode: "101279", material: "Caja de cartón corrugado", unit: "UN",
    approved: 1480, programmed: 1480, dispatched: 1280, delivered: 1180, updated: "28 jun 2026 · 16:20",
    trips: [{ id: "VIA-2026-041-A", vehicle: "VHC-041", quantity: 900 }, { id: "VIA-2026-041-B", vehicle: "VHC-052", quantity: 580 }]
  },
  {
    id: "PED-2026-11022", pedido: "PED-2026-11022", line: "01", document: "REM-2026-0214", order: "OTI-2026-042", delivery: "ENT-2026-042", pod: "POD-2026-042",
    farm: "Finca El Retiro", notice: "AC-2026-034", noticeVersion: "v1", materialCode: "101279", material: "Caja de cartón corrugado", unit: "UN",
    approved: 520, programmed: 520, dispatched: 520, delivered: 520, updated: "28 jun 2026 · 17:05",
    trips: [{ id: "VIA-2026-042-A", vehicle: "VHC-018", quantity: 520 }]
  },
  {
    id: "PED-2026-11021-Z", pedido: "PED-2026-11021", line: "02", document: "RPT-2026-0921", order: "OTI-2026-041", delivery: "ENT-2026-041", pod: null,
    farm: "Finca Santa Isabel", notice: "AC-2026-032", noticeVersion: "v2", materialCode: "4925", material: "Zuncho amarillo", unit: "M",
    approved: 400, programmed: 450, dispatched: 380, delivered: null, updated: "28 jun 2026 · 16:20",
    trips: [{ id: "VIA-2026-041-A", vehicle: "VHC-041", quantity: 300 }, { id: "VIA-2026-041-B", vehicle: "VHC-052", quantity: 150 }]
  },
  {
    id: "PRC-2026-006", pedido: "PRC-2026-006", line: "01", document: "RES-2026-0067", order: "OTI-2026-043", delivery: null, pod: null,
    farm: "Finca Las Palmas", notice: null, noticeVersion: null, materialCode: "EPP-024", material: "Guantes de seguridad", unit: "PAR",
    approved: 24, programmed: 24, dispatched: null, delivered: null, updated: "28 jun 2026 · 15:40",
    trips: [{ id: "VIA-2026-043-A", vehicle: "VHC-033", quantity: 24 }]
  },
  {
    id: "PED-2026-11023", pedido: "PED-2026-11023", line: "01", document: "REM-2026-0215", order: "OTI-2026-044", delivery: "ENT-2026-044", pod: "POD-2026-044",
    farm: "Finca El Retiro", notice: "AC-2026-034", noticeVersion: "v1", materialCode: "5418", material: "Separador de pallet", unit: "PAQ",
    approved: 35, programmed: 35, dispatched: 35, delivered: 22, updated: "28 jun 2026 · 17:12",
    trips: [{ id: "VIA-2026-044-A", vehicle: "VHC-018", quantity: 35 }]
  }
];

export const stages = [
  { key: "approved", label: "Consolidado aprobado", short: "Aprobado", source: "Materiales" },
  { key: "programmed", label: "Programado en vehículos", short: "Programado", source: "Transporte" },
  { key: "dispatched", label: "Despacho confirmado", short: "Despachado", source: "Transporte" },
  { key: "delivered", label: "Entregado con POD", short: "Con POD", source: "Finca y soporte" }
];

export const materialKey = (item) => `${item.materialCode}|${item.unit}`;

export function totalsFor(cases) {
  return Object.fromEntries(stages.map(({ key }) => [key, !cases.length || cases.some((item) => !Number.isFinite(item[key]))
    ? null : cases.reduce((sum, item) => sum + item[key], 0)]));
}

export function casesForAlert(cases, alert) {
  if (alert === "overprogrammed") return cases.filter((item) => item.programmed > item.approved);
  if (alert === "pendingPod") return cases.filter((item) => item.dispatched !== null && (item.delivered === null || item.delivered < item.dispatched));
  if (alert === "noDeparture") return cases.filter((item) => item.dispatched === null);
  return cases;
}

export function caseIssues(item) {
  const issues = [];
  const add = (kind, label, detail) => issues.push({ kind, label, detail });
  const unit = item.unit;
  if (!Number.isFinite(item.approved)) add("source", "Aprobación sin dato", "Falta la cantidad consolidada aprobada.");
  if (!Number.isFinite(item.programmed)) add("source", "Programación sin dato", "Falta la cantidad programada en vehículos.");
  if (Number.isFinite(item.approved) && Number.isFinite(item.programmed)) {
    if (item.programmed > item.approved) add("overprogrammed", "Sobreprogramado", `${item.programmed - item.approved} ${unit} programados sobre lo aprobado`);
    if (item.programmed < item.approved) add("unprogrammed", "Por programar", `${item.approved - item.programmed} ${unit} aprobados sin programar`);
  }
  if (!Number.isFinite(item.dispatched)) add("noDeparture", "Sin despacho confirmado", "Falta confirmar la cantidad que salió.");
  if (Number.isFinite(item.programmed) && Number.isFinite(item.dispatched)) {
    if (item.dispatched < item.programmed) add("partialDeparture", "Salida parcial", `${item.programmed - item.dispatched} ${unit} programados sin salida confirmada`);
    if (item.dispatched > item.programmed) add("overDeparture", "Despacho por revisar", `${item.dispatched - item.programmed} ${unit} sobre lo programado`);
  }
  if (Number.isFinite(item.dispatched) && !Number.isFinite(item.delivered)) add("pendingPod", "POD sin validar", "Falta cantidad recibida con POD válido.");
  if (Number.isFinite(item.dispatched) && Number.isFinite(item.delivered)) {
    if (item.delivered < item.dispatched) add("partialPod", "Entrega por conciliar", `${item.dispatched - item.delivered} ${unit} despachados sin POD válido`);
    if (item.delivered > item.dispatched) add("overDelivery", "Entrega por revisar", `${item.delivered - item.dispatched} ${unit} sobre lo despachado`);
    if (item.delivered > 0 && !item.pod) add("pendingPod", "POD sin validar", "La cantidad recibida no tiene soporte POD indicado.");
  }
  return issues;
}

export function caseReading(item) {
  const issues = caseIssues(item);
  if (issues.length) return { label: issues.length === 1 ? issues[0].label : `${issues.length} brechas`, tone: "warning", issues };
  return { label: item.approved === 0 ? "Sin movimiento" : "Conciliado", tone: "success", issues };
}
