<script lang="ts" setup>
import { dayjs } from "element-plus";
import { openPath } from "@tauri-apps/plugin-opener";

const setting = useSettingStore();
const downloadUrl = ref();
const latestVersion = ref<AppPlatformsJSON>();
const activeTab = ref('client'); // client, files, history

// 获取最新版本信息
watch([() => setting.isWeb, () => setting.isMobileSize, latestVersion], async ([isWeb, isMobileSize]) => {
  if (!isWeb) return;
  if (latestVersion.value) {
    const ua = navigator.userAgent;
    const res = latestVersion.value;
    if (isMobileSize) {
      downloadUrl.value = `${BaseUrlAppFile}/app/${res.version}/YuLingChat_${res.version}.apk`;
      return;
    }
    if (ua.toLowerCase().includes("windows"))
      downloadUrl.value = res.platforms["windows-x86_64"].url;
    else if (ua.toLowerCase().includes("macos"))
      downloadUrl.value = res.platforms["darwin-aarch64"].url;
    else if (ua.toLowerCase().includes("linux"))
      downloadUrl.value = res.platforms["linux-x86_64"].url;
    else if (ua.includes("iPhone"))
      downloadUrl.value = `${BaseUrlAppFile}/app/${res.version}/YuLingChat_${res.version}.apk`;
    else
      downloadUrl.value = "https://kiwi233.top/%E9%A1%B9%E7%9B%AE/%E6%9E%81%E7%89%A9%E8%81%8A%E5%A4%A9.html#%F0%9F%92%BB-%E4%B8%8B%E8%BD%BD";
  }
}, { immediate: true });

// 平台信息
const platforms = computed(() => [
  {
    name: 'Windows',
    icon: 'i-solar:windows-bold-duotone',
    desc: 'Windows 10/11',
    url: latestVersion.value?.platforms?.["windows-x86_64"]?.url || '#',
    size: '约 50MB'
  },
  {
    name: 'macOS',
    icon: 'i-solar:apple-bold-duotone', 
    desc: 'macOS 10.15+',
    url: latestVersion.value?.platforms?.["darwin-aarch64"]?.url || '#',
    size: '约 45MB'
  },
  {
    name: 'Linux',
    icon: 'i-solar:linux-bold-duotone',
    desc: 'Ubuntu 18.04+',
    url: latestVersion.value?.platforms?.["linux-x86_64"]?.url || '#',
    size: '约 40MB'
  },
  {
    name: 'Android',
    icon: 'i-solar:smartphone-bold-duotone',
    desc: 'Android 7.0+',
    url: latestVersion.value?.version ? `${BaseUrlAppFile}/app/${latestVersion.value.version}/YuLingChat_${latestVersion.value.version}.apk` : '#',
    size: '约 35MB'
  }
]);

// 下载文件列表
const search = ref("");
const showSearch = ref(false);
const filterList = computed(() => {
  if (search.value.trim()) {
    return setting.fileDownloadList.filter(p =>
      p.fileName.toLowerCase().includes(search.value.toLowerCase()),
    );
  }
  return setting.fileDownloadList;
});

const FileStatusClassMap: Record<FileStatus, string> = {
  [FileStatus.ERROR]: "el-color-error",
  [FileStatus.PAUSED]: "op-70",
  [FileStatus.NOT_FOUND]: "line-through grayscale",
  [FileStatus.DOWNLOADING]: "",
  [FileStatus.DOWNLOADED]: "",
};

// 打开搜索
async function openSearch() {
  showSearch.value = !showSearch.value;
}

// 下载客户端
function downloadClient(url: string, platform: string) {
  if (url === '#') {
    ElMessage.warning('暂未提供该平台版本');
    return;
  }
  window.open(url, '_blank');
  ElMessage.success(`正在下载 ${platform} 版本`);
}

// 清空下载历史
function clearDownloadHistory() {
  ElMessageBox.confirm('确定要清空所有下载历史吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清空下载历史
    (setting.fileDownloadMap as any).value = {};
    ElMessage.success('下载历史已清空');
  }).catch(() => {
    // 用户取消操作
  });
}

// 打开下载文件夹
async function openDownloadFolder() {
  if (!await existsFile(setting.appDataDownloadDirUrl)) {
    ElMessageBox.confirm("下载目录不存在，是否创建？", {
      title: "提示",
      center: true,
      confirmButtonText: "创建",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button-warning",
      lockScroll: true,
      callback: async (action: string) => {
        if (action === "confirm") {
          mkdirFile(setting.appDataDownloadDirUrl);
        }
      },
    });
    return;
  }
  await openPath(setting.appDataDownloadDirUrl);
}

onMounted(async () => {
  const res = await getLatestVersion();
  if (res) {
    latestVersion.value = res;
  }
  
  // 检查下载文件状态
  setting.fileDownloadList.filter(p => p.status === FileStatus.DOWNLOADING).forEach(async (p) => {
    const isExist = await existsFile(p.localPath);
    if (!isExist)
      p.status = FileStatus.NOT_FOUND;
    else
      p.status = FileStatus.DOWNLOADED;
  });
});
</script>

<template>
  <div class="download-page h-full flex flex-col overflow-hidden">
    <!-- 头部 -->
    <div class="flex items-center justify-between border-b border-default p-4">
      <div class="flex items-center gap-3">
        <i class="i-solar-download-minimalistic-bold-duotone text-2xl text-theme-primary" />
        <div>
          <h1 class="text-xl font-bold">下载中心</h1>
          <p class="text-sm text-gray-500">管理客户端下载和文件下载</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button @click="$router.back()" size="small">
          <i class="i-solar-arrow-left-linear mr-1" />
          返回
        </el-button>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="border-b border-default">
      <el-tabs v-model="activeTab" class="px-4">
        <el-tab-pane label="客户端下载" name="client">
          <div class="p-4">
            <!-- 版本信息 -->
            <div class="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-900/20 dark:to-purple-900/20">
              <div class="flex items-center gap-3 mb-4">
                <img src="/logo.png" class="h-12 w-12 rounded-lg" />
                <div>
                  <h2 class="text-xl font-bold">语灵Chat</h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    最新版本 v{{ latestVersion?.version || '1.0.0' }}
                  </p>
                </div>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                轻量级跨平台IM聊天应用，集成AI机器人、音视频通话及AI购物。支持多端消息同步，自定义主题，高效便捷。
              </p>
            </div>

            <!-- 平台下载 -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div
                v-for="platform in platforms"
                :key="platform.name"
                class="group cursor-pointer rounded-lg border border-default bg-white p-4 transition-all hover:border-theme-primary hover:shadow-lg dark:bg-dark-7"
                @click="downloadClient(platform.url, platform.name)"
              >
                <div class="flex items-center gap-3 mb-3">
                  <i :class="platform.icon" class="text-2xl text-theme-primary" />
                  <div>
                    <h3 class="font-semibold">{{ platform.name }}</h3>
                    <p class="text-xs text-gray-500">{{ platform.desc }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ platform.size }}</span>
                  <i class="i-solar-download-minimalistic-broken text-theme-primary transition-transform group-hover:translate-y-1" />
                </div>
              </div>
            </div>

            <!-- 功能特性 -->
            <div class="mt-8">
              <h3 class="mb-4 text-lg font-semibold">功能特性</h3>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="flex items-center gap-3 rounded-lg border border-default p-3">
                  <i class="i-solar-chat-round-dots-bold-duotone text-theme-primary" />
                  <div>
                    <h4 class="font-medium">智能聊天</h4>
                    <p class="text-xs text-gray-500">AI机器人对话</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 rounded-lg border border-default p-3">
                  <i class="i-solar-phone-bold-duotone text-theme-primary" />
                  <div>
                    <h4 class="font-medium">音视频通话</h4>
                    <p class="text-xs text-gray-500">高清通话体验</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 rounded-lg border border-default p-3">
                  <i class="i-solar-palette-bold-duotone text-theme-primary" />
                  <div>
                    <h4 class="font-medium">主题定制</h4>
                    <p class="text-xs text-gray-500">个性化界面</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="文件下载" name="files">
          <div class="p-4">
            <!-- 搜索栏 -->
            <div class="mb-4 flex items-center gap-2">
              <el-input
                v-model="search"
                placeholder="搜索文件..."
                size="small"
                clearable
                class="flex-1"
              >
                <template #prefix>
                  <i class="i-solar-magnifer-broken" />
                </template>
              </el-input>
              <el-button @click="clearDownloadHistory" size="small" type="danger">
                <i class="i-solar-trash-bin-trash-outline mr-1" />
                清空历史
              </el-button>
            </div>

            <!-- 文件列表 -->
            <div class="max-h-96 overflow-y-auto">
              <div v-if="filterList.length" class="space-y-2">
                <div
                  v-for="file in filterList"
                  :key="file.downloadTime"
                  class="group flex items-center gap-3 rounded-lg border border-default bg-white p-3 transition-all hover:shadow-md dark:bg-dark-7"
                  :class="FileStatusClassMap[file.status]"
                  @click="setting.openFileByDefaultApp(file)"
                >
                  <img
                    :src="file.mimeType ? FILE_TYPE_ICON_MAP[file.mimeType] : FILE_TYPE_ICON_DEFAULT"
                    class="h-8 w-8 object-contain"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="truncate text-sm font-medium">{{ file.fileName }}</p>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      <span>{{ formatFileSize(file.totalSize || 0) }}</span>
                      <span>•</span>
                      <span>{{ dayjs(file.downloadTime).format('YYYY-MM-DD HH:mm') }}</span>
                      <span>•</span>
                      <span>{{ DownFileTextMap[file.status] }}</span>
                    </div>
                    <el-progress
                      v-if="file.status === FileStatus.DOWNLOADING"
                      :percentage="+((file.currentSize / file.totalSize) * 100 || 0).toFixed(2)"
                      :stroke-width="4"
                      :show-text="false"
                      class="mt-1"
                    />
                  </div>
                  <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <el-button
                      v-if="file.status === FileStatus.DOWNLOADED"
                      size="small"
                      text
                      @click.stop="setting.openFileFolder(file)"
                    >
                      <i class="i-solar-folder-with-files-line-duotone" />
                    </el-button>
                    <el-button
                      size="small"
                      text
                      type="danger"
                      @click.stop="setting.deleteDownloadFile(file)"
                    >
                      <i class="i-solar-trash-bin-trash-outline" />
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-12 text-gray-500">
                <i class="i-solar-folder-with-files-line-duotone mb-2 text-4xl" />
                <p class="text-sm">暂无下载文件</p>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="下载设置" name="settings">
          <div class="p-4">
            <div class="space-y-6">
              <!-- 下载路径设置 -->
              <div v-if="!setting.isWeb" class="rounded-lg border border-default p-4">
                <h3 class="mb-4 text-lg font-semibold">下载路径</h3>
                <div class="flex items-center gap-3">
                  <el-input
                    :model-value="setting.appDataDownloadDirUrl"
                    readonly
                    placeholder="请选择下载路径"
                    class="flex-1"
                  />
                  <el-button @click="setting.changeDownloadDir()">
                    更改路径
                  </el-button>
                  <el-button @click="openDownloadFolder">
                    打开目录
                  </el-button>
                </div>
              </div>

              <!-- 下载选项 -->
              <div class="rounded-lg border border-default p-4">
                <h3 class="mb-4 text-lg font-semibold">下载选项</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span>下载完成后通知</span>
                    <el-switch v-model="setting.sysPermission.isNotificationSound" />
                  </div>
                </div>
              </div>

              <!-- 统计信息 -->
              <div class="rounded-lg border border-default p-4">
                <h3 class="mb-4 text-lg font-semibold">下载统计</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-theme-primary">
                      {{ setting.fileDownloadList.length }}
                    </div>
                    <div class="text-sm text-gray-500">总下载数</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-500">
                      {{ setting.fileDownloadList.filter(f => f.status === FileStatus.DOWNLOADED).length }}
                    </div>
                    <div class="text-sm text-gray-500">成功下载</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.download-page {
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style> 