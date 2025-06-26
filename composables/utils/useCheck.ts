import { getCurrentWindow } from "@tauri-apps/api/window";

export function checkEmail(email: string): boolean {
  return /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
};

export function checkPhone(phone: string): boolean {
  return /^(?:(?:\+|00)86)?1[3-9]\d{9}$/.test(phone);
}

/**
 * 检测浏览器是否支持 border-radius < windows11、linux全部 不支持
 * @returns {boolean} 是否支持 border-radius
 */
export function checkBorderRadiusSupport() {
  const userAgent = navigator.userAgent.toLowerCase();
  // 检测是否为 Windows 11 或更高版本
  if (userAgent.includes("windows nt")) {
    const match = userAgent.match(/windows nt (\d+\.\d+)/);
    if (match && match[1]) {
      const version = +(match[1]);
      // Windows 11 对应 NT 10.0，但需要通过其他方式区分 Win10 和 Win11
      // 这里简化处理，认为 Windows 10+ 支持
      console.log(`Detected Windows version: ${version}`);
      if (version <= 10.0) {
        const win = getCurrentWindow();
        win.setShadow(false);
      }
      return version <= 10.0;
    }
  }
  // Linux 系统不支持
  if (userAgent.includes("linux")) {
    return false;
  }
  // macOS 支持
  if (userAgent.includes("mac os")) {
    return true;
  }

  return false;
}
