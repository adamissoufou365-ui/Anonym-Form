import type { FormDef, FormResponse, Question, QuestionType } from "@/lib/forms-store";

const Q_TYPE_LABEL: Record<QuestionType, string> = {
  short: "Texte court",
  long: "Texte long",
  single: "Choix unique",
  multiple: "Choix multiples",
};

const formatIsoDate = (ts: number) => new Date(ts).toISOString();

const formatDisplayDate = (ts: number) =>
  new Date(ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const normalizeText = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const sanitizeFileName = (raw: string) => {
  const base = normalizeText(raw).trim() || "formulaire";
  return base.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").slice(0, 80);
};

const sanitizeSheetName = (raw: string) => {
  // Excel forbids: : \ / ? * [ ]
  let s = normalizeText(raw).replace(/[:\\/?*[\]]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) s = "Reponse";
  // 31 chars max
  return s.slice(0, 31);
};

const formatAnswerText = (q: Question, value: unknown): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    // Une ligne par option selectionnee, lisible sans separateurs CSV
    return value.map((x) => `- ${String(x)}`).join("\n");
  }
  const s = typeof value === "string" ? value : value == null ? "" : String(value);
  return s.trim();
};

const headerStyle = {
  font: { bold: true },
  alignment: { vertical: "middle" as const },
  fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE9E9E9" } },
  border: {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  },
};

export async function buildResponsesWorkbook(form: FormDef, responses: FormResponse[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ANONYM FORM";
  wb.created = new Date();

  const title = form.title?.trim() || "Formulaire";
  const oldestFirst = [...responses].sort((a, b) => a.submittedAt - b.submittedAt);
  const orderByResponseId = new Map(oldestFirst.map((r, idx) => [r.id, idx + 1]));

  // --- Vue densemble (premiere feuille)
  const overview = wb.addWorksheet(sanitizeSheetName("Vue densemble"), {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  overview.getColumn(1).width = 28;
  overview.getColumn(2).width = 46;
  overview.getColumn(3).width = 22;
  overview.getColumn(4).width = 40;

  overview.mergeCells("A1:B1");
  overview.getCell("A1").value = "Export des reponses";
  overview.getCell("A1").font = { bold: true, size: 14 };

  overview.getCell("A2").value = "Formulaire";
  overview.getCell("B2").value = title;
  overview.getCell("A3").value = "ID formulaire";
  overview.getCell("B3").value = form.id;
  overview.getCell("A4").value = "Nombre de reponses";
  overview.getCell("B4").value = responses.length;

  const oHeader = overview.addRow(["Reponse", "Date (locale)", "Date (ISO)", "ID reponse"]);
  oHeader.eachCell((cell) => Object.assign(cell, headerStyle));

  responses.forEach((r, i) => {
    const orderNum = orderByResponseId.get(r.id) ?? i + 1;
    overview.addRow([
      String(orderNum).padStart(3, "0"),
      formatDisplayDate(r.submittedAt),
      formatIsoDate(r.submittedAt),
      r.id,
    ]);
  });

  // --- Une feuille par reponse
  const usedNames = new Set<string>([overview.name]);

  responses.forEach((r, i) => {
    const orderNum = orderByResponseId.get(r.id) ?? i + 1;
    const num = String(orderNum).padStart(3, "0");
    let baseName = sanitizeSheetName(`Rep ${num}`);
    if (!baseName) baseName = "Rep";

    let name = baseName;
    let n = 2;
    while (usedNames.has(name)) {
      const suffix = ` ${n}`;
      name = sanitizeSheetName(`${baseName}`.slice(0, 31 - suffix.length) + suffix);
      n += 1;
    }
    usedNames.add(name);

    const ws = wb.addWorksheet(name, {
      views: [{ state: "frozen", ySplit: 7 }],
    });
    ws.getColumn(1).width = 8;
    ws.getColumn(2).width = 44;
    ws.getColumn(3).width = 18;
    ws.getColumn(4).width = 12;
    ws.getColumn(5).width = 52;

    ws.mergeCells("A1:E1");
    ws.getCell("A1").value = title;
    ws.getCell("A1").font = { bold: true, size: 14 };

    ws.getCell("A2").value = "ID formulaire";
    ws.getCell("B2").value = form.id;
    ws.getCell("A3").value = "Reponse";
    ws.getCell("B3").value = `#${num}`;
    ws.getCell("A4").value = "Date de soumission (locale)";
    ws.getCell("B4").value = formatDisplayDate(r.submittedAt);
    ws.getCell("A5").value = "Date de soumission (ISO)";
    ws.getCell("B5").value = formatIsoDate(r.submittedAt);
    ws.getCell("A6").value = "ID reponse";
    ws.getCell("B6").value = r.id;

    const hr = ws.addRow(["Ordre", "Question", "Type", "Obligatoire", "Reponse"]);
    hr.eachCell((cell) => Object.assign(cell, headerStyle));

    form.questions.forEach((q, qi) => {
      const row = ws.addRow([
        qi + 1,
        (q.label || "").trim() || "(sans titre)",
        Q_TYPE_LABEL[q.type] ?? q.type,
        q.required ? "Oui" : "Non",
        formatAnswerText(q, r.answers[q.id]),
      ]);
      row.getCell(5).alignment = { vertical: "top", wrapText: true };
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return buf;
}

export async function downloadResponsesXlsx(form: FormDef, responses: FormResponse[]) {
  const buf = await buildResponsesWorkbook(form, responses);
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const name = `${sanitizeFileName(form.title || "reponses")}-reponses.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
