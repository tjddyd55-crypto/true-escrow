/**
 * ExecutionPlanDoc → PDF Buffer (server API).
 * 한글 폰트 등록, i18n(translate), 날짜 미설정 방어.
 */

import path from "path";
import fs from "fs";
import type { ExecutionPlanDoc } from "./types";
import { translate, type DocLang } from "./i18nServer";
// @ts-expect-error pdfkit has no default export in types
import PDFDocument from "pdfkit";

const FONT_PATH_KR = path.join(process.cwd(), "assets", "fonts", "NotoSansKR-Regular.ttf");

function resolveTitle(lang: DocLang, title: string): string {
  if (title.startsWith("executionPlan.") || title.includes("template.")) {
    const t = translate(lang, title);
    return t !== title ? t : title;
  }
  return title;
}

function approvalLabel(lang: DocLang, role: string): string {
  const key =
    role === "BUYER"
      ? "executionPlan.approvalBuyer"
      : role === "SELLER"
        ? "executionPlan.approvalSeller"
        : role === "ADMIN"
          ? "executionPlan.approvalAdmin"
          : "executionPlan.approvalVerifier";
  return translate(lang, key);
}

function payoutLabel(lang: DocLang, code: string): string {
  if (!code || code === "UNSET") return translate(lang, "executionPlan.payoutUnset");
  if (code === "FULL") return translate(lang, "executionPlan.payoutFull");
  if (code === "NONE") return translate(lang, "executionPlan.payoutNone");
  if (code.startsWith("RATIO:")) {
    const pct = code.slice(6).trim();
    return translate(lang, "executionPlan.payoutRatio").replace("{pct}", pct);
  }
  if (code.startsWith("FIXED:")) {
    const amount = code.slice(6).trim();
    return translate(lang, "executionPlan.payoutFixed").replace("{amount}", amount);
  }
  return code;
}

export type RenderPdfOptions = {
  lang?: DocLang;
};

export function renderExecutionPlanToPdf(
  doc: ExecutionPlanDoc,
  options: RenderPdfOptions = {}
): Promise<Buffer> {
  const lang = options.lang ?? "ko";

  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    const hasKoreanFont = fs.existsSync(FONT_PATH_KR);
    if (hasKoreanFont) {
      pdf.registerFont("NotoSansKR", FONT_PATH_KR);
      pdf.font("NotoSansKR");
    } else {
      pdf.font("Helvetica");
    }

    const { transaction, summary, timeline, disclaimerLines } = doc;
    const t = (key: string) => translate(lang, key);

    pdf.fontSize(18).text(t("executionPlan.title"), { continued: false });
    pdf.fontSize(12).text(transaction.title, { continued: false });
    if (transaction.description) {
      pdf.fontSize(10).text(transaction.description, { continued: false });
    }

    pdf.moveDown();
    pdf.fontSize(10).fillColor("#444");
    if (transaction.startDateISO && transaction.endDateISO) {
      pdf.text(`${transaction.startDateISO} – ${transaction.endDateISO}`);
    } else {
      pdf.text(t("executionPlan.dateUnset"));
    }
    if (summary.totalDays != null) {
      pdf.text(`${t("executionPlan.totalDays")}: ${summary.totalDays}`);
    }
    pdf.text(`${t("executionPlan.blockCount")}: ${summary.blockCount}`);
    if (transaction.parties?.buyerId || transaction.parties?.sellerId) {
      pdf.text(
        `${t("executionPlan.parties")}: ${[transaction.parties.buyerId, transaction.parties.sellerId].filter(Boolean).join(", ")}`
      );
    }

    pdf.moveDown(1.5);
    pdf.fontSize(12).fillColor("#000").text("Timeline", { continued: false });
    pdf.moveDown(0.5);

    let y = pdf.y;
    for (const item of timeline) {
      if (y > 700) {
        pdf.addPage();
        if (hasKoreanFont) pdf.font("NotoSansKR");
        y = 50;
      }

      const title = resolveTitle(lang, item.title);

      if (item.gapFromPrevDays != null && item.gapFromPrevDays > 0) {
        const gapText = t("executionPlan.daysElapsed").replace("{n}", String(item.gapFromPrevDays));
        pdf.fontSize(9).fillColor("#666").text(gapText);
        pdf.moveDown(0.25);
      }

      pdf.fontSize(10).fillColor("#000").text(title);
      if (item.dateStartISO || item.dateEndISO) {
        const range =
          item.dateStartISO && item.dateEndISO
            ? `${item.dateStartISO} – ${item.dateEndISO}`
            : item.dateStartISO ?? item.dateEndISO ?? "";
        pdf.fontSize(9).fillColor("#555").text(range);
        if (item.durationDays != null) {
          pdf.text(`${t("executionPlan.durationDays").replace("{n}", String(item.durationDays))}`);
        }
      } else if (item.kind === "BLOCK" || item.kind === "START" || item.kind === "END") {
        pdf.fontSize(9).fillColor("#666").text(t("executionPlan.dateUnset"));
      }
      if (item.kind === "BLOCK") {
        if (item.approvalRoles?.length) {
          const labels = item.approvalRoles.map((r) => approvalLabel(lang, r));
          pdf.fontSize(9).text(`${t("executionPlan.approvals")}: ${labels.join(", ")}`);
        }
        if (item.conditions?.length) {
          const conds = item.conditions.map((c) => (c.startsWith("executionPlan.") || c.includes("template.") ? translate(lang, c) : c));
          const line = conds.join(", ");
          pdf.fontSize(9).text(`${t("executionPlan.conditions")}: ${line}`, { lineBreak: true });
        }
        if (item.payoutRule) {
          pdf.fontSize(9).text(`${t("executionPlan.payoutRule")}: ${payoutLabel(lang, item.payoutRule)}`);
        }
      }
      pdf.moveDown(0.8);
      y = pdf.y;
    }

    pdf.moveDown(1);
    pdf.fontSize(9).fillColor("#666");
    for (const line of disclaimerLines) {
      pdf.text(line);
    }

    pdf.end();
  });
}
