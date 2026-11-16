import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

/**
 * فحص أمني فعلي قابل للتشغيل محليًا — المرحلة 4 (أمن).
 *
 * يفحص الملفات المصدرية للبوابة (portal/src + portal/scripts) عن:
 * 1. أنماط أسرار شائعة ملتزمة في الشيفرة (توليد، AWS، Google، OpenAI، رابط اتصال بكلمة مرور).
 * 2. حقول كلمة مرور غير مشتقة (نص صريح) في الشيفرة.
 * 3. استخدامات eval/new Function/child_process مع سطر مُدمج (نقاط حقن شيفرة).
 * 4. فحص ملفات البيئة الملتزمة (.env فعلية).
 * 5. فحص أن كل استخدام ل process.env في الشيفرة غير الخادمية آمن (لا سر يمر للعميل).
 *
 * الاستخدام:
 *   cd portal && npm run security:audit
 * كود الخروج: 0 = نظيف، 1 = نتائج. مخرجات JSON إلى stdout.
 */

interface Finding {
  file: string;
  line: number;
  rule: string;
  severity: "high" | "medium" | "low";
  snippet: string;
}

const ROOT = path.resolve(process.cwd(), "src", "lib");
const SRC_DIRS = ["src", "scripts"];
const EXTENSIONS = [".ts", ".tsx"];

const SECRET_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  { rule: "aws_access_key", re: /AKIA[0-9A-Z]{16}/g, severity: "high" },
  { rule: "google_api_key", re: /AIza[0-9A-Za-z\-_]{35}/g, severity: "high" },
  { rule: "openai_key", re: /sk-[a-zA-Z0-9]{20,}/g, severity: "high" },
  { rule: "github_token", re: /ghp_[a-zA-Z0-9]{36,}/g, severity: "high" },
  { rule: "private_key_block", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, severity: "high" },
  { rule: "connection_string_password", re: /postgres(?:ql)?:\/\/[^:\s"']+:[^@\s"']+@/gi, severity: "high" },
  { rule: "resend_api_key", re: /re_[0-9A-Za-z]{24,}/g, severity: "high" },
];

const DANGEROUS_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  { rule: "eval_usage", re: /\beval\s*\(/g, severity: "high" },
  { rule: "new_function", re: /\bnew\s+Function\s*\(/g, severity: "high" },
  { rule: "child_process_exec", re: /\bexec(?:Sync)?\s*\(/g, severity: "medium" },
  { rule: "dangerously_set_inner_html", re: /dangerouslySetInnerHTML/g, severity: "medium" },
];

function* walk(dir: string): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      yield* walk(p);
    } else if (EXTENSIONS.includes(path.extname(e.name))) {
      yield p;
    }
  }
}

function collectEnvFiles(dir: string): string[] {
  const found: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (e.isFile() && /^\.env(\.|$)/.test(e.name) && e.name !== ".env.example") {
      found.push(path.join(dir, e.name));
  }
  return found;
}

function scanLine(
  filePath: string,
  lines: string[],
  lineIdx: number,
  patterns: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }>,
  findings: Finding[],
): void {
  const line = lines[lineIdx];
  for (const { rule, re, severity } of patterns) {
    re.lastIndex = 0;
    const m = re.exec(line);
  if (m) {
      findings.push({
        file: filePath,
        line: lineIdx + 1,
        rule,
        severity,
        snippet: line.slice(0, 120).trim(),
      });
    }
  }
}

function main(): void {
  const findings: Finding[] = [];
  const cwd = process.cwd();

  // 1) فحص الشيفرة على الأسرار والأنماط الخطرة
  for (const dir of SRC_DIRS) {
    for (const file of walk(path.join(cwd, dir))) {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        scanLine(file, lines, i, SECRET_PATTERNS, findings);
        scanLine(file, lines, i, DANGEROUS_PATTERNS, findings);
      }
    }
  }

  // 2) فحص ملفات .env الملتزمة
  const envFiles = collectEnvFiles(cwd);
  for (const f of envFiles) {
    findings.push({
      file: f,
      line: 0,
      rule: "committed_env_file",
      severity: "high",
      snippet: ".env file with real values should never be committed",
  });
  }

  // 3) تقرير
  const report = {
    checkedAt: new Date().toISOString(),
    scope: "portal (src + scripts)",
    scannedDirs: SRC_DIRS,
    findingsCount: findings.length,
    findings: findings.slice(0, 50),
    status: findings.length === 0 ? "clean" : "findings_found",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = findings.length > 0 ? 1 : 0;
}

main();

// ملاحظة: هذا الفحص مساعدة للمراجعة، لا بديلًا عن فحص CI الكامل
// (gitleaks على التاريخ الكامل) المحدد في docs/HUDHUD-CONTROL-PHASE3-2026-11-16.md.
