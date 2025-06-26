
import { DEFAULT_FONT_FAMILY_LIST } from "~/composables/store/useSettingStore";

export const IFRAME_TOGGLE_THEME_EVENT = "toggle-theme";

// 接口请求获取基本系统常量
export async function initSystemConstant() {
  loadOssConstant();
  watchFontFamily();
}
async function watchFontFamily() {
  const setting = useSettingStore();

  // 初始化字体列表
  if (!setting.settingPage.fontFamily.list.length) {
    setting.settingPage.fontFamily.list = DEFAULT_FONT_FAMILY_LIST;
  }

  // 动态加载网络字体
  async function loadWebFont(fontItem: typeof DEFAULT_FONT_FAMILY_LIST[0]) {
    if (!fontItem.url || !document.fonts)
      return;

    try {
      const fontFace = new FontFace(
        fontItem.value,
        `url(${fontItem.url}) format("woff2")`,
        { weight: String(fontItem.baseFontWeight || 400) },
      );

      await fontFace.load();
      document.fonts.add(fontFace);
    }
    catch (error) {
      console.warn(`字体加载失败: ${fontItem.name}`, error);
    }
  }

  // 初始化一次
  loadFont(setting.settingPage.fontFamily.value).catch(console.error);

  async function loadFont(fontValue: string) {
    // 从默认字体列表中查找对应的字体配置
    const fontItem = DEFAULT_FONT_FAMILY_LIST.find(item => item.value === fontValue);

    // 如果是网络字体，先加载
    if (fontItem?.url) {
      await loadWebFont(fontItem);
    }
    const fontStack = `${fontValue}, HarmonyOS_Sans_SC, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    document.documentElement.style.setProperty("--font-family", fontStack);
  }

  // 监听字体变化并应用到根元素
  watch(
    () => setting.settingPage.fontFamily.value,
    async (fontValue) => {
      if (fontValue) {
        const loading = document
          ? ElLoading.service({
              fullscreen: true,
              text: "加载中...",
              background: "transparent",
              spinner: defaultLoadingIcon,
            })
          : null;
        await loadFont(fontValue);
        setTimeout(() => {
          loading?.close();
        }, 300);
      }
    },
  );
}

// 加载OSS常量
async function loadOssConstant() {
  const setting = useSettingStore();
  // OSS文件要求（限制）
  try {
    const ossRes = await useHttp.get<Result<OssConstantVO>>("/res/oss/constant");
    if (ossRes.code === StatusCode.SUCCESS) {
      setting.systemConstant.ossInfo = ossRes.data;
    }
    else {
      ElMessage.closeAll("error");
      console.warn("获取OSS配置失败", ossRes);
    }
  }
  catch (error) {
    ElMessage.closeAll("error");
    console.error("获取OSS配置失败", error);
  }
}

export interface SystemConstantVO {
  ossInfo?: OssConstantVO
}

export interface OssConstantVO extends Record<OssConstantItemType, OssConstantItemVO> {

}
export type OssConstantItemType = "image" | "video" | "file" | "font" | "audio";
export interface OssConstantItemVO {
  /**
   * 文件类型
   */
  code?: OssFileCodeType;
  /**
   * 文件后缀
   */
  fileSize?: number;
  fileType?: string;
  path?: string;
  timeOut?: number;
  type?: string;
}

export enum OssFileCodeType {
  IMAGE = 0,
  VIDEO = 1,
  FILE = 2,
  FONT = 3,
  SOUND = 4,
}
