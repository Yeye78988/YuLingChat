#!/usr/bin/env node

/**
 * 性能分析和监控脚本
 * 参考: lighthouse, web-vitals, bundle-analyzer 等工具
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
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

class PerformanceAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, "..");
    this.packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, "package.json"), "utf8"));
    this.reportsDir = path.join(this.projectRoot, "reports");
  }

  /**
   * 确保报告目录存在
   */
  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * 分析构建产物大小
   */
  async analyzeBundleSize() {
    log.step("分析构建产物大小...");
    this.ensureReportsDir();

    try {
      // 检查是否存在构建产物
      const outputDirs = [
        path.join(this.projectRoot, ".output"),
        path.join(this.projectRoot, "dist"),
      ];

      let buildDir = null;
      for (const dir of outputDirs) {
        if (fs.existsSync(dir)) {
          buildDir = dir;
          break;
        }
      }

      if (!buildDir) {
        log.warning("未找到构建产物，请先运行构建命令");
        return;
      }

      // 分析文件大小
      const analysis = this.analyzeDirSize(buildDir);
      const reportPath = path.join(this.reportsDir, "bundle-size.json");

      fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

      // 显示结果
      log.success("构建产物分析完成:");
      console.log(`  总大小: ${this.formatBytes(analysis.totalSize)}`);
      console.log(`  文件数量: ${analysis.totalFiles}`);
      console.log(`  最大文件: ${analysis.largestFile.name} (${this.formatBytes(analysis.largestFile.size)})`);

      // 检查大文件
      const largeFiles = analysis.files.filter(f => f.size > 1024 * 1024); // > 1MB
      if (largeFiles.length > 0) {
        log.warning("发现大文件 (>1MB):");
        largeFiles.forEach((f) => {
          console.log(`  ${f.path}: ${this.formatBytes(f.size)}`);
        });
      }
    }
    catch (error) {
      log.error(`构建产物分析失败: ${error.message}`);
    }
  }

  /**
   * 分析目录大小
   */
  analyzeDirSize(dirPath) {
    const files = [];
    let totalSize = 0;
    let totalFiles = 0;
    let largestFile = { name: "", size: 0 };

    const scanDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);

      items.forEach((item) => {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          scanDir(itemPath);
        }
        else {
          const relativePath = path.relative(this.projectRoot, itemPath);
          const fileInfo = {
            path: relativePath,
            size: stats.size,
            name: item,
          };

          files.push(fileInfo);
          totalSize += stats.size;
          totalFiles++;

          if (stats.size > largestFile.size) {
            largestFile = { name: relativePath, size: stats.size };
          }
        }
      });
    };

    scanDir(dirPath);

    return {
      totalSize,
      totalFiles,
      largestFile,
      files: files.sort((a, b) => b.size - a.size).slice(0, 20), // 前20个最大文件
    };
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0)
      return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 运行 Lighthouse 分析
   */
  async runLighthouse(url = "http://localhost:3000") {
    log.step(`运行 Lighthouse 分析 (${url})...`);
    this.ensureReportsDir();

    try {
      // 检查 Lighthouse 是否安装
      try {
        execSync("lighthouse --version", { stdio: "pipe" });
      }
      catch {
        log.warning("Lighthouse 未安装，正在安装...");
        execSync("npm install -g lighthouse", { stdio: "inherit" });
      }

      const reportPath = path.join(this.reportsDir, "lighthouse-report.html");
      const jsonPath = path.join(this.reportsDir, "lighthouse-report.json");

      const command = `lighthouse ${url} --output=html,json --output-path=${path.join(this.reportsDir, "lighthouse-report")} --chrome-flags="--headless"`;

      execSync(command, {
        cwd: this.projectRoot,
        stdio: "inherit",
      });

      log.success("Lighthouse 分析完成");
      log.info(`HTML 报告: ${reportPath}`);
      log.info(`JSON 报告: ${jsonPath}`);

      // 解析 JSON 报告显示关键指标
      if (fs.existsSync(jsonPath)) {
        const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        this.displayLighthouseMetrics(report);
      }
    }
    catch (error) {
      log.error(`Lighthouse 分析失败: ${error.message}`);
    }
  }

  /**
   * 显示 Lighthouse 关键指标
   */
  displayLighthouseMetrics(report) {
    const audits = report.audits;
    const metrics = {
      "首次内容绘制 (FCP)": audits["first-contentful-paint"]?.displayValue,
      "最大内容绘制 (LCP)": audits["largest-contentful-paint"]?.displayValue,
      "累积布局偏移 (CLS)": audits["cumulative-layout-shift"]?.displayValue,
      "首次输入延迟 (FID)": audits["max-potential-fid"]?.displayValue,
      "性能评分": report.categories?.performance?.score ? Math.round(report.categories.performance.score * 100) : "N/A",
    };

    log.success("Lighthouse 关键指标:");
    Object.entries(metrics).forEach(([name, value]) => {
      console.log(`  ${name}: ${value || "N/A"}`);
    });
  }

  /**
   * 监控内存使用
   */
  monitorMemory(duration = 60) {
    log.step(`监控内存使用 (${duration}秒)...`);
    this.ensureReportsDir();

    const startTime = Date.now();
    const memoryData = [];

    const monitor = setInterval(() => {
      const usage = process.memoryUsage();
      const timestamp = Date.now() - startTime;

      memoryData.push({
        timestamp,
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
      });

      console.log(`内存使用: RSS=${this.formatBytes(usage.rss)}, Heap=${this.formatBytes(usage.heapUsed)}/${this.formatBytes(usage.heapTotal)}`);
    }, 1000);

    setTimeout(() => {
      clearInterval(monitor);

      // 保存监控数据
      const reportPath = path.join(this.reportsDir, "memory-usage.json");
      fs.writeFileSync(reportPath, JSON.stringify(memoryData, null, 2));

      log.success("内存监控完成");
      log.info(`报告已保存: ${reportPath}`);

      // 显示统计信息
      const maxRss = Math.max(...memoryData.map(d => d.rss));
      const maxHeap = Math.max(...memoryData.map(d => d.heapUsed));

      console.log(`  最大 RSS: ${this.formatBytes(maxRss)}`);
      console.log(`  最大堆使用: ${this.formatBytes(maxHeap)}`);
    }, duration * 1000);
  }

  /**
   * 网络性能测试
   */
  async testNetworkPerformance(url = "http://localhost:3000") {
    log.step(`测试网络性能 (${url})...`);

    const tests = [
      { name: "DNS 解析", test: () => this.measureDNS(url) },
      { name: "连接时间", test: () => this.measureConnection(url) },
      { name: "首字节时间", test: () => this.measureTTFB(url) },
    ];

    for (const { name, test } of tests) {
      try {
        const result = await test();
        console.log(`  ${name}: ${result}ms`);
      }
      catch (error) {
        console.log(`  ${name}: 失败 - ${error.message}`);
      }
    }
  }

  /**
   * 测量 DNS 解析时间
   */
  async measureDNS(url) {
    const { performance } = require("node:perf_hooks");
    const { URL } = require("node:url");
    const dns = require("node:dns").promises;

    const hostname = new URL(url).hostname;

    const start = performance.now();
    await dns.lookup(hostname);
    const end = performance.now();

    return Math.round(end - start);
  }

  /**
   * 测量连接时间
   */
  async measureConnection(url) {
    const { performance } = require("node:perf_hooks");

    return new Promise((resolve, reject) => {
      const start = performance.now();

      const req = https.request(url, { method: "HEAD" }, () => {
        const end = performance.now();
        resolve(Math.round(end - start));
      });

      req.on("error", reject);
      req.end();
    });
  }

  /**
   * 测量首字节时间
   */
  async measureTTFB(url) {
    const { performance } = require("node:perf_hooks");

    return new Promise((resolve, reject) => {
      const start = performance.now();
      let ttfb = 0;

      const req = https.request(url, (res) => {
        ttfb = performance.now() - start;
        res.on("data", () => {
          if (ttfb === 0) {
            ttfb = performance.now() - start;
          }
        });
        res.on("end", () => resolve(Math.round(ttfb)));
      });

      req.on("error", reject);
      req.end();
    });
  }

  /**
   * 生成性能报告
   */
  async generateReport() {
    log.title("生成性能报告...");
    this.ensureReportsDir();

    const reportData = {
      timestamp: new Date().toISOString(),
      project: this.packageJson.name,
      version: this.packageJson.version,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: os.totalmem(),
        cpus: os.cpus().length,
      },
    };

    // 添加构建分析
    try {
      await this.analyzeBundleSize();
      const bundleReport = path.join(this.reportsDir, "bundle-size.json");
      if (fs.existsSync(bundleReport)) {
        reportData.bundleAnalysis = JSON.parse(fs.readFileSync(bundleReport, "utf8"));
      }
    }
    catch (error) {
      log.warning("构建分析失败，跳过");
    }

    // 保存总报告
    const reportPath = path.join(this.reportsDir, "performance-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    log.success("性能报告生成完成");
    log.info(`报告路径: ${reportPath}`);
  }
}

// 命令行参数处理
const command = process.argv[2];
const option = process.argv[3];
const analyzer = new PerformanceAnalyzer();

switch (command) {
  case "bundle":
    analyzer.analyzeBundleSize();
    break;
  case "lighthouse":
    analyzer.runLighthouse(option || "http://localhost:3000");
    break;
  case "memory":
    analyzer.monitorMemory(Number.parseInt(option) || 60);
    break;
  case "network":
    analyzer.testNetworkPerformance(option || "http://localhost:3000");
    break;
  case "report":
    analyzer.generateReport();
    break;
  default:
    console.log(`
用法: node scripts/performance.js <command> [option]

命令:
  bundle              分析构建产物大小
  lighthouse [url]    运行 Lighthouse 分析
  memory [duration]   监控内存使用 (秒)
  network [url]       测试网络性能
  report              生成完整性能报告

示例:
  node scripts/performance.js bundle
  node scripts/performance.js lighthouse http://localhost:3000
  node scripts/performance.js memory 120
  node scripts/performance.js network https://example.com
  node scripts/performance.js report
    `);
}
