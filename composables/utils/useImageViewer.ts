import { createApp, h } from "vue";
import ImageViewer from "~/components/image/ImageViewer.vue";

interface ViewerOptions {
  urlList: string[];
  initialIndex?: number;
  ctxName?: string;
}

interface ViewerInstance {
  open: (options: ViewerOptions) => void;
  close: () => void;
  destroy: () => void;
}

// 单例实例
let instance: ViewerInstance | null = null;

function createOrGetImageViewer(): ViewerInstance {
  // 如果已存在实例则返回
  if (instance)
    return instance;

  // 创建容器
  const container = document.createElement("div");
  container.classList.add("global-image-viewer-container");
  document.body.appendChild(container);
  // 创建应用实例
  const app = createApp({
    render() {
      return h(ImageViewer, {
        ref: "viewer",
      });
    },
  });

  // 挂载应用
  const mount = app.mount(container);
  const viewer = mount.$refs.viewer as {
    open: (options: { urlList: string[], index: number, ctxName?: string }) => void;
    close: () => void;
    state?: any;
  };
  const chat = useChatStore();

  // 保存实例引用
  instance = {
    open: (options: ViewerOptions) => {
      try {
        viewer.open({
          urlList: options.urlList,
          index: options.initialIndex || 0,
          ctxName: options.ctxName,
        });
        chat.showImageViewer = true;
      }
      catch (error) {
        console.error("Failed to open image viewer:", error);
        chat.showImageViewer = false;
      }
    },
    close: () => {
      try {
        viewer.close();
        chat.showImageViewer = false;
      }
      catch (error) {
        console.error("Failed to close image viewer:", error);
        chat.showImageViewer = false;
      }
    },
    destroy: () => {
      app.unmount();
      document.body.removeChild(container);
      instance = null;
      chat.showImageViewer = false;
    },
  };

  return instance;
}

// 全局可调用的查看器
export const useImageViewer = {
  open(options: ViewerOptions) {
    const viewer = createOrGetImageViewer();
    viewer.open(options);
    return viewer;
  },
  close() {
    if (instance) {
      instance.close();
    }
  },
  destroy() {
    if (instance) {
      instance.destroy();
    }
  },
};
