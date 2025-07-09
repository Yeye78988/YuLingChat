#!/usr/bin/env node

/**
 * 开发服务器管理脚本
 * 参考: vite, nuxt, webpack-dev-server 等项目
 */

const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
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

class DevServer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, "..");
    this.packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, "package.json"), "utf8"));
    this.processes = new Map();
  }

  /**
   * 检查端口是否被占用
   */
  async checkPort(port) {
    return new Promise((resolve) => {
      const { createServer } = require("node:net");
      const server = createServer();

      server.listen(port, (err) => {
        if (err) {
          resolve(false);
        }
        else {
          server.once("close", () => resolve(true));
          server.close();
        }
      });

      server.on("error", () => resolve(false));
    });
  }

  /**
   * 查找可用端口
   */
  async findAvailablePort(startPort = 3000) {
    let port = startPort;
    while (port < startPort + 100) {
      if (await this.checkPort(port)) {
        return port;
      }
      port++;
    }
    throw new Error(`无法找到可用端口 (尝试范围: ${startPort}-${port})`);
  }

  /**
   * 启动 Nuxt 开发服务器
   */
  async startNuxt(env = "development") {
    log.step(`启动 Nuxt 开发服务器 (${env})...`);

    const envFile = env === "production" ? ".env.production" : ".env.development";
    const envLocalFile = `${envFile}.local`;

    // 检查环境文件
    if (!fs.existsSync(path.join(this.projectRoot, envLocalFile))) {
      log.warning(`环境文件 ${envLocalFile} 不存在`);
      if (fs.existsSync(path.join(this.projectRoot, envFile))) {
        log.info("将使用默认环境文件");
      }
    }

    try {
      const command = env === "production" ? "prod:nuxt" : "dev:nuxt";
      const nuxtProcess = spawn("pnpm", [command], {
        cwd: this.projectRoot,
        stdio: "inherit",
        shell: true,
      });

      this.processes.set("nuxt", nuxtProcess);

      nuxtProcess.on("close", (code) => {
        if (code !== 0) {
          log.error(`Nuxt 服务器退出，代码: ${code}`);
        }
        this.processes.delete("nuxt");
      });

      nuxtProcess.on("error", (error) => {
        log.error(`Nuxt 服务器启动失败: ${error.message}`);
        this.processes.delete("nuxt");
      });

      log.success("Nuxt 开发服务器启动成功");
    }
    catch (error) {
      log.error(`启动 Nuxt 服务器失败: ${error.message}`);
    }
  }

  /**
   * 启动 Tauri 开发服务器
   */
  async startTauri() {
    log.step("启动 Tauri 开发服务器...");

    try {
      const tauriProcess = spawn("pnpm", ["dev:tauri"], {
        cwd: this.projectRoot,
        stdio: "inherit",
        shell: true,
      });

      this.processes.set("tauri", tauriProcess);

      tauriProcess.on("close", (code) => {
        if (code !== 0) {
          log.error(`Tauri 开发服务器退出，代码: ${code}`);
        }
        this.processes.delete("tauri");
      });

      tauriProcess.on("error", (error) => {
        log.error(`Tauri 开发服务器启动失败: ${error.message}`);
        this.processes.delete("tauri");
      });

      log.success("Tauri 开发服务器启动成功");
    }
    catch (error) {
      log.error(`启动 Tauri 服务器失败: ${error.message}`);
    }
  }

  /**
   * 启动移动端开发
   */
  async startMobile(platform = "android") {
    log.step(`启动 ${platform} 开发服务器...`);

    const validPlatforms = ["android", "ios"];
    if (!validPlatforms.includes(platform)) {
      log.error(`不支持的平台: ${platform}. 支持的平台: ${validPlatforms.join(", ")}`);
      return;
    }

    try {
      const command = `dev:${platform}`;
      const mobileProcess = spawn("pnpm", [command], {
        cwd: this.projectRoot,
        stdio: "inherit",
        shell: true,
      });

      this.processes.set(platform, mobileProcess);

      mobileProcess.on("close", (code) => {
        if (code !== 0) {
          log.error(`${platform} 开发服务器退出，代码: ${code}`);
        }
        this.processes.delete(platform);
      });

      mobileProcess.on("error", (error) => {
        log.error(`${platform} 开发服务器启动失败: ${error.message}`);
        this.processes.delete(platform);
      });

      log.success(`${platform} 开发服务器启动成功`);
    }
    catch (error) {
      log.error(`启动 ${platform} 服务器失败: ${error.message}`);
    }
  }

  /**
   * 显示系统信息
   */
  showSystemInfo() {
    log.title("系统信息:");

    const totalMem = os.totalmem() / (1024 * 1024 * 1024);
    const freeMem = os.freemem() / (1024 * 1024 * 1024);
    const cpus = os.cpus();

    console.log(`  操作系统: ${os.type()} ${os.release()}`);
    console.log(`  架构: ${os.arch()}`);
    console.log(`  CPU: ${cpus[0].model} (${cpus.length} 核)`);
    console.log(`  内存: ${totalMem.toFixed(1)}GB (可用: ${freeMem.toFixed(1)}GB)`);
    console.log(`  Node.js: ${process.version}`);

    try {
      const rustVersion = execSync("rustc --version", { encoding: "utf8" }).trim();
      console.log(`  Rust: ${rustVersion}`);
    }
    catch {
      console.log("  Rust: 未安装");
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    log.step("执行健康检查...");

    const checks = [
      {
        name: "Node.js 版本",
        check: () => {
          const version = process.version.substring(1);
          return this.compareVersions(version, "20.0.0") >= 0;
        },
      },
      {
        name: "依赖安装",
        check: () => fs.existsSync(path.join(this.projectRoot, "node_modules")),
      },
      {
        name: "环境文件",
        check: () => {
          const envFiles = [".env.development.local", ".env.production.local"];
          return envFiles.some(file => fs.existsSync(path.join(this.projectRoot, file)));
        },
      },
      {
        name: "Tauri 配置",
        check: () => fs.existsSync(path.join(this.projectRoot, "src-tauri", "tauri.conf.json")),
      },
    ];

    let passed = 0;

    for (const { name, check } of checks) {
      try {
        if (check()) {
          log.success(`${name}: 正常`);
          passed++;
        }
        else {
          log.error(`${name}: 异常`);
        }
      }
      catch (error) {
        log.error(`${name}: 检查失败 - ${error.message}`);
      }
    }

    log.info(`健康检查完成: ${passed}/${checks.length} 项通过`);

    if (passed < checks.length) {
      log.warning("请修复上述问题后重新启动开发服务器");
    }
  }

  /**
   * 比较版本号
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split(".").map(Number);
    const v2parts = version2.split(".").map(Number);
    const maxLength = Math.max(v1parts.length, v2parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part > v2part)
        return 1;
      if (v1part < v2part)
        return -1;
    }

    return 0;
  }

  /**
   * 停止所有服务
   */
  stopAll() {
    log.step("停止所有开发服务器...");

    this.processes.forEach((process, name) => {
      log.info(`停止 ${name} 服务器...`);
      process.kill("SIGTERM");
    });

    this.processes.clear();
    log.success("所有服务器已停止");
  }

  /**
   * 设置信号处理
   */
  setupSignalHandlers() {
    process.on("SIGINT", () => {
      log.info("\n收到 SIGINT 信号，正在停止服务器...");
      this.stopAll();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      log.info("收到 SIGTERM 信号，正在停止服务器...");
      this.stopAll();
      process.exit(0);
    });
  }
}

// 命令行参数处理
const command = process.argv[2];
const option = process.argv[3];
const devServer = new DevServer();

// 设置信号处理
devServer.setupSignalHandlers();

switch (command) {
  case "nuxt":
    devServer.startNuxt(option || "development");
    break;
  case "tauri":
    devServer.startTauri();
    break;
  case "mobile":
    devServer.startMobile(option || "android");
    break;
  case "info":
    devServer.showSystemInfo();
    break;
  case "health":
    devServer.healthCheck();
    break;
  case "stop":
    devServer.stopAll();
    break;
  default:
    console.log(`
用法: node scripts/dev.js <command> [option]

命令:
  nuxt [env]        启动 Nuxt 开发服务器 [development|production]
  tauri             启动 Tauri 开发服务器
  mobile [platform] 启动移动端开发 [android|ios]
  info              显示系统信息
  health            执行健康检查
  stop              停止所有服务器

示例:
  node scripts/dev.js nuxt development
  node scripts/dev.js tauri
  node scripts/dev.js mobile android
  node scripts/dev.js health
    `);
}
