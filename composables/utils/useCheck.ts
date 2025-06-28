export function checkEmail(email: string): boolean {
  return /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
};

export function checkPhone(phone: string): boolean {
  return /^(?:(?:\+|00)86)?1[3-9]\d{9}$/.test(phone);
}

// /**
//  * 检测浏览器是否支持 border-radius < windows11、linux全部 不支持
//  * @returns {Promise<boolean>} 是否支持 border-radius
//  */
// export async function checkBorderRadiusSupport(): Promise<boolean> {
//   try {
//     // 使用 Tauri 的系统版本检测
//     const systemVersion = await invoke<string>("get_system_version");
//     console.log(`Detected system version: ${systemVersion}`);

//     if (systemVersion.startsWith("windows_")) {
//       // Windows 11 支持 border-radius，Windows 10 及以下不支持
//       const isWindows11OrHigher = systemVersion === "windows_11";

//       if (!isWindows11OrHigher) {
//         const win = getCurrentWindow();
//         win.setShadow(false);
//       }

//       return isWindows11OrHigher;
//     }

//     // Linux 系统不支持
//     if (systemVersion.startsWith("linux_")) {
//       return false;
//     }

//     // macOS 支持
//     if (systemVersion.startsWith("macos_")) {
//       return true;
//     }

//     return false;
//   }
//   catch (error) {
//     console.error("Failed to get system version:", error);
//     return false;
//   }
// }
