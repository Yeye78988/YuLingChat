#!/usr/bin/env node

/**
 * 代码质量检查脚本
 * 参考: vue-next, element-plus, vite 等项目
 */

const { execSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
};

const log = {
  info: msg => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: msg => console.log(`${colors.bright}${colors.magenta}🚀 ${msg}${colors.reset}`),
  step: msg => console.log(`${colors.blue}📝 ${msg}${colors.reset}`),
};

class QualityChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, "..");
    this.packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, "package.json"), "utf8"));
    this.results = {
      lint: false,
      typecheck: false,
      test: false,
      coverage: false,
    };
  }

  /**
   * 运行 ESLint 检查
   */
  async runLint(fix = false) {
    log.step("运行 ESLint 检查...");
    try {
      const command = fix ? "pnpm lint:fix" : "pnpm lint";
      execSync(command, {
        cwd: this.projectRoot,
        stdio: "inherit",
      });
      log.success("ESLint 检查通过");
      this.results.lint = true;
    }
    catch (error) {
      log.error("ESLint 检查失败");
      this.results.lint = false;
      if (!fix) {
        log.info("提示: 运行 `node scripts/quality.js lint --fix` 自动修复部分问题");
      }
    }
  }

  /**
   * 运行 TypeScript 类型检查
   */
  async runTypeCheck() {
    log.step("运行 TypeScript 类型检查...");
    try {
      execSync("pnpm vue-tsc --noEmit", {
        cwd: this.projectRoot,
        stdio: "inherit",
      });
      log.success("TypeScript 类型检查通过");
      this.results.typecheck = true;
    }
    catch (error) {
      log.error("TypeScript 类型检查失败");
      this.results.typecheck = false;
    }
  }

  /**
   * 运行测试
   */
  async runTests() {
    log.step("运行测试...");

    const hasTestScript = this.packageJson.scripts?.test;
    if (!hasTestScript) {
      log.warning("未找到测试脚本，跳过测试");
      return;
    }

    try {
      execSync("pnpm test", {
        cwd: this.projectRoot,
        stdio: "inherit",
      });
      log.success("测试通过");
      this.results.test = true;
    }
    catch (error) {
      log.error("测试失败");
      this.results.test = false;
    }
  }

  /**
   * 生成测试覆盖率报告
   */
  async runCoverage() {
    log.step("生成测试覆盖率报告...");

    const hasCoverageScript = this.packageJson.scripts?.coverage || this.packageJson.scripts?.["test:coverage"];
    if (!hasCoverageScript) {
      log.warning("未找到覆盖率脚本，跳过覆盖率检查");
      return;
    }

    try {
      const command = this.packageJson.scripts?.coverage ? "pnpm coverage" : "pnpm test:coverage";
      execSync(command, {
        cwd: this.projectRoot,
        stdio: "inherit",
      });
      log.success("覆盖率报告生成完成");
      this.results.coverage = true;
    }
    catch (error) {
      log.error("覆盖率报告生成失败");
      this.results.coverage = false;
    }
  }

  /**
   * 检查代码复杂度
   */
  async checkComplexity() {
    log.step("检查代码复杂度...");

    // 检查是否有复杂度检查工具
    const files = this.getSourceFiles();
    const complexFiles = [];

    for (const file of files.slice(0, 10)) { // 限制检查前10个文件以避免太慢
      try {
        const content = fs.readFileSync(file, "utf8");
        const lines = content.split("\n").length;
        const complexity = this.calculateComplexity(content);

        if (complexity > 15 || lines > 500) {
          complexFiles.push({
            file: path.relative(this.projectRoot, file),
            lines,
            complexity,
          });
        }
      }
      catch (error) {
        // 忽略读取错误
      }
    }

    if (complexFiles.length > 0) {
      log.warning("发现复杂度较高的文件:");
      complexFiles.forEach(({ file, lines, complexity }) => {
        console.log(`  ${file}: ${lines} 行, 复杂度 ${complexity}`);
      });
    }
    else {
      log.success("代码复杂度检查通过");
    }
  }

  /**
   * 简单的复杂度计算
   */
  calculateComplexity(content) {
    const complexityKeywords = [
      "if",
      "else",
      "for",
      "while",
      "switch",
      "case",
      "catch",
      "&&",
      "||",
      "?",
      ":",
    ];

    let complexity = 1;
    for (const keyword of complexityKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, "g"));
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * 获取源文件列表
   */
  getSourceFiles() {
    const extensions = [".vue", ".ts", ".js"];
    const dirs = ["components", "composables", "pages", "layouts", "plugins"];
    const files = [];

    for (const dir of dirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        files.push(...this.getFilesRecursive(dirPath, extensions));
      }
    }

    return files;
  }

  /**
   * 递归获取文件
   */
  getFilesRecursive(dir, extensions) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        files.push(...this.getFilesRecursive(itemPath, extensions));
      }
      else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(itemPath);
      }
    }

    return files;
  }

  /**
   * 运行所有检查
   */
  async runAll(options = {}) {
    log.title("开始代码质量检查...");

    const startTime = Date.now();

    await this.runLint(options.fix);
    await this.runTypeCheck();
    await this.runTests();
    await this.runCoverage();
    await this.checkComplexity();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    this.showSummary(duration);
  }

  /**
   * 显示检查结果摘要
   */
  showSummary(duration) {
    log.title("检查结果摘要:");

    const checks = [
      { name: "ESLint", result: this.results.lint },
      { name: "TypeScript", result: this.results.typecheck },
      { name: "测试", result: this.results.test },
      { name: "覆盖率", result: this.results.coverage },
    ];

    checks.forEach(({ name, result }) => {
      if (result === true) {
        log.success(`${name}: 通过`);
      }
      else if (result === false) {
        log.error(`${name}: 失败`);
      }
      else {
        log.warning(`${name}: 跳过`);
      }
    });

    const passed = checks.filter(c => c.result === true).length;
    const total = checks.filter(c => c.result !== null).length;

    console.log(`\n检查完成! 耗时: ${duration}s`);
    console.log(`通过率: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`);

    if (passed === total) {
      log.success("🎉 所有检查都通过了！");
    }
    else {
      log.error("❌ 部分检查未通过，请修复后重试");
      process.exit(1);
    }
  }

  /**
   * 观察模式
   */
  watch() {
    log.title("启动观察模式...");

    const watcher = spawn("pnpm", ["lint", "--watch"], {
      cwd: this.projectRoot,
      stdio: "inherit",
    });

    watcher.on("close", (code) => {
      if (code !== 0) {
        log.error(`观察模式退出，代码: ${code}`);
      }
    });

    process.on("SIGINT", () => {
      log.info("停止观察模式");
      watcher.kill();
      process.exit(0);
    });
  }
}

// 命令行参数处理
const command = process.argv[2];
const hasFixFlag = process.argv.includes("--fix");
const checker = new QualityChecker();

switch (command) {
  case "lint":
    checker.runLint(hasFixFlag);
    break;
  case "typecheck":
    checker.runTypeCheck();
    break;
  case "test":
    checker.runTests();
    break;
  case "coverage":
    checker.runCoverage();
    break;
  case "complexity":
    checker.checkComplexity();
    break;
  case "watch":
    checker.watch();
    break;
  default:
    checker.runAll({ fix: hasFixFlag });
}
