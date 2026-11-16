import fs from "node:fs";
import path from "node:path";

/**
 * فحص أمني فعلي قابل للتشغيل محليًا — المرحلة 4 (أمن) → توسيع المرحلة F.
 *
 * يفحص مصادر كل تطبيقات HUDHUD (وليس portal فقط) عن:
 * 1. أنماط أسرار شائعة ملتزمة في الشيفرة (AWS، Google، OpenAI، GitHub، Resend،
 *    مفاتيح خاصة، رابط اتصال بكلمة مرور).
 * 2. نقاط حقن شيفرة (eval / new Function / exec المدمج / dangerouslySetInnerHTML).
 * 3. ملفات .env فعلية ملتزمة في المستودع (في أي تطبيق).
 * 4. [جديد F] مفاتيح AI في المتصفح: أي استخدام لـ NEXT_PUBLIC_*_API_KEY
 *    في كود AI — سياسة E-02 (المفتاح لا يمر للمتصفح أبدًا).
 * 5. [جديد F] SSRF أولي: أي fetch/axios خادمي يستقبل عنوان URL من مدخلات
 *    الطلب مباشرة دون تحقق — يعلّم للمراجعة اليدوية.
 * 6. [جديد F] عناوين URL مضمنة بروتوكولات غير مسموحة (http:// غير localhost
 *    في كود الإنتاج — يجب أن تأتي من البيئة).
 *
 * الاستخدام:
 *   cd portal && npm run security:audit
 * النطاق: يصعد من portal إلى جذر المستودع ويفحص كل تطبيقات HUDHUD.
 * كود الخروج: 0 = نظيف، 1 = نتائج. مخرجات JSON إلى stdout.
 *
 * ملاحظة: مساعدة للمراجعة المحلية، لا بديل عن فحص CI الكامل (gitleaks
 * على التاريخ كاملًا) — ولا يفحص ملفات ثنائية أو lockfiles (خارج النطاق).
 */

interface Finding {
  file: string;
  line: number;
  rule: string;
  severity: "high" | "medium" | "low";
  snippet: string;
}

/** تطبيقات HUDHUD كما في سجل البوابة + portal — مصدر واحد للتوسيع */
const APP_DIRS = [
  "portal",
  "osiris-map",
  "neureed",
  "loki-verify",
  "zexa-auth",
  "nchat/frontend",
  "rhex-forum",
  "umami",
] as const;

/** أدلة تُستثنى: بناء/اعتماديات/مستندات/عينات مولدة */
const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".turbo",
  "target",
  ".venv",
  "__pycache__",
  "vendor",
]);

/** امتدادات الشيفرة المدعومة عبر الأطر (TS/TSX/JS/JSX + Python لـ loki) */
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".py"];

/** ملفات يُتوقع وجود تعريفات القواعد فيها — استبعاد ذاتي */
const SELF_FILES = new Set(["scripts/security-audit.ts", "scripts/security-audit.js"]);

/** ملفات معروفة أنها توثق الأسرار (قوالب/اختبارات سياسة) — تُستثنى من قاعدة الأسرار لا من قواعد الحقن */
const DOCS_ALLOWLIST_SECRET = [
  ".env.example",
  "key-policy.test.ts",
  "key-policy.ts",
];

const SECRET_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  { rule: "aws_access_key", re: /AKIA[0-9A-Z]{16}/g, severity: "high" },
  { rule: "google_api_key", re: /AIza[0-9A-Za-z\-_]{35}/g, severity: "high" },
  { rule: "openai_key", re: /sk-[a-zA-Z0-9]{20,}/g, severity: "high" },
  { rule: "github_token", re: /ghp_[a-zA-Z0-9]{36,}/g, severity: "high" },
  {
    rule: "private_key_block",
    re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: "high",
  },
  {
    rule: "connection_string_password",
    re: /postgres(?:ql)?:\/\/[^:\s"']+:[^@\s"']+@/gi,
    severity: "high",
  },
  { rule: "resend_api_key", re: /re_[0-9A-Za-z]{24,}/g, severity: "high" },
];

const DANGEROUS_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  { rule: "eval_usage", re: /\beval\s*\(/g, severity: "high" },
  { rule: "new_function", re: /\bnew\s+Function\s*\(/g, severity: "high" },
  { rule: "child_process_exec", re: /\bexec(?:Sync)?s*\(/g, severity: "medium" },
  { rule: "dangerously_set_inner_html", re: /dangerouslySetInnerHTML/g, severity: "medium" },
];

/** [F] سياسة E-02: مفاتيح AI لا تُقرأ في المتصفح أبدًا */
const AI_KEY_IN_BROWSER_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  {
    rule: "ai_key_next_public_browser",
    re: /NEXT_PUBLIC_(OPENAI|ANTHROPIC)_API_KEY/g,
    severity: "high",
  },
  {
    rule: "ai_key_env_browser_guard",
    // typeof window check متبوع بقراءة مفتاح — نمط nchat القديم المكتشف في E-02
    re: /typeof\s+window\s*!==?\s*"undefined"[\s\S]{0,120}(API_KEY)/g,
    severity: "medium",
  },
];

/** [F] SSRF أولي: fetch خادمي بعنوان من مدخلات الطلب */
const SSRF_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  {
    rule: "fetch_request_url_unverified",
    re: /fetch\s*\(\s*(req(?:uest)?\.(?:json|url|searchParams|query)|body\.url|body\.target)/gi,
    severity: "high",
  },
];

/** [F] عناوين إنتاج مضمنة في الكود بدل البيئة (لا نطاق لكل تطبيق) */
const EMBEDDED_URL_PATTERNS: Array<{ rule: string; re: RegExp; severity: Finding["severity"] }> = [
  {
    rule: "hardcoded_http_url",
    // http:// غير localhost/127.0.0.1 — يجب أن يأتي من البيئة أو قالب .env.example
    re: /https?:\/\/(?!localhost|127\.0\.0\.1)[a-z0-9-]+(\.[a-z0-9-]+)+/gi,
    severity: "low",
  },
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
      if (EXCLUDED_DIR_NAMES.has(e.name)) continue;
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
        // مقتطف فقط — لا يُعرض كامل السطر أبدًا (قد يحوي سرًا)
        snippet: line.slice(0, 100).trim(),
      });
    }
  }
}

/** استبعاد الملفات الموثقة: قوالب البيئة واختبارات السياسة */
function isSecretAllowlisted(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, "/");
  return DOCS_ALLOWLIST_SECRET.some((f) => norm.endsWith(f));
}

function isSelf(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, "/");
  return SELF_FILES.has(norm) || norm.endsWith("security-audit.ts");
}

function main(): void {
  const findings: Finding[] = [];
  const root = process.cwd().startsWith("portal")
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

  // 1) فحص شيفرة كل التطبيقات
  for (const app of APP_DIRS) {
    const appRoot = path.join(root, app);
    for (const file of walk(appRoot)) {
      let content: string;
      try {
        content = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      const lines = content.split("\n");
      const relPath = path.relative(root, file);
      for (let i = 0; i < lines.length; i++) {
        if (!isSecretAllowlisted(relPath)) {
          scanLine(relPath, lines, i, SECRET_PATTERNS, findings);
        }
        if (!isSelf(relPath)) {
          scanLine(relPath, lines, i, DANGEROUS_PATTERNS, findings);
        }
        // [F] قواعد المرحلة F — على كل التطبيقات (استبعاد ذاتي دائم)
        if (!isSelf(relPath)) {
          scanLine(relPath, lines, i, AI_KEY_IN_BROWSER_PATTERNS, findings);
          scanLine(relPath, lines, i, SSRF_PATTERNS, findings);
          // عناوين مضمنة: تستثنى ملفات التوثيق والاختبارات (تستخدم عناوين توضيحية شرعية)
          if (!/\.(test|spec)\./.test(relPath)) {
            scanLine(relPath, lines, i, EMBEDDED_URL_PATTERNS, findings);
          }
        }
      }
    }

    // 3) ملفات .env فعلية في كل تطبيق
    for (const f of collectEnvFiles(appRoot)) {
      findings.push({
        file: path.relative(root, f),
        line: 0,
        rule: "committed_env_file",
        severity: "high",
        snippet: "ملف .env بقيم فعلية يجب ألا يُلتزم في المستودع",
      });
    }
  }

  // 4) تقرير
  const bySeverity = { high: 0, medium: 0, low: 0 } as Record<Finding["severity"], number>;
  for (const f of findings) bySeverity[f.severity] += 1;

  const report = {
    checkedAt: new Date().toISOString(),
    scope: "all HUDHUD apps (portal, osiris-map, neureed, loki-verify, zexa-auth, nchat/frontend, rhex-forum, umami)",
    appsScanned: APP_DIRS,
    findingsCount: findings.length,
    bySeverity,
    findings: findings.slice(0, 100),
    status: findings.length === 0 ? "clean" : "findings_found",
    note: "أداة مراجعة محلية — gitleaks في CI يبقى الفيصل على تاريخ المستودع كاملًا",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = findings.length > 0 ? 1 : 0;
}

main();
