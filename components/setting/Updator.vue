<script setup lang="ts">
import { MdPreview } from "md-editor-v3";
import { appEnName } from "~/constants";
import "md-editor-v3/lib/preview.css";

const setting = useSettingStore();
const progress = computed(() => +((setting.appUploader.downloaded / setting.appUploader.contentLength) * 100 || 0).toFixed(2));

const latestVersionInfo = ref<AppVersionInfoVO | null>(null);

onMounted(async () => {
  const res = await getVersionNotice("latest");
  if (res.code === StatusCode.SUCCESS) {
    latestVersionInfo.value = res.data;
  }
  else {
    latestVersionInfo.value = null;
  }
});

const ignoreUpdate = computed({
  get: () => setting.appUploader.ignoreVersion.includes(latestVersionInfo.value?.version || ""),
  set: (val) => {
    if (val) {
      setting.appUploader.ignoreVersion.push(latestVersionInfo.value?.version || "");
    }
    else {
      setting.appUploader.ignoreVersion = setting.appUploader.ignoreVersion.filter(v => v !== latestVersionInfo.value?.version);
    }
  },
});
</script>

<template>
  <el-popover
    v-if="!setting.appUploader.isUpdating"
    placement="bottom"
    width="fit-content"
    :teleported="true"
    popper-style="border-radius: 0.75rem;"
    popper-class="popover"
    trigger="click"
    append-to="body"
    :hide-after="0"
  >
    <template #reference>
      <ElButton
        v-if="setting.isDesktop"
        class="flex-row-c-c cursor-pointer transition-all"

        round plain
        size="small"
        style="padding: 0 0.8em 0 0.5em; height: 2em;width: 6em;"
        :type="setting.appUploader.isUpdating ? 'warning' : 'info'"
      >
        <span flex-row-c-c>
          <i
            i-solar:refresh-outline mr-1 inline-block
            :class="setting.appUploader.isCheckUpdatateLoad ? 'animate-spin' : ''"
          />
          {{ setting.appUploader.isUpload ? '新版本' : '检查更新' }}
        </span>
      </ElButton>
    </template>
    <template #default>
      <div class="w-16rem p-1">
        <!-- 版本信息 -->
        <div class="top flex">
          <CardElImage src="/logo.png" class="mr-3 h-10 w-10" />
          <div class="flex flex-1 flex-col justify-around text-xs">
            <strong>
              {{ appEnName }}
            </strong>
            <div class="">
              v{{ latestVersionInfo?.version.replace(/^v/, '') || '-' }} 版本
            </div>
          </div>
        </div>
        <div class="main py-3">
          <small>发现新版本，立即更新体验新功能 🎉</small>
          <el-scrollbar max-height="25rem">
            <MdPreview
              language="zh-CN"
              editor-id="version-toast"
              show-code-row-number
              :no-img-zoom-in="setting.isMobileSize"
              :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
              :code-foldable="false"
              class="preview m-0 bg-transparent p-0"
              :model-value="(latestVersionInfo?.noticeSummary || '').substring(0, 200)"
            />
          </el-scrollbar>
        </div>
        <div class="flex-row-bt-c">
          <el-checkbox v-model="ignoreUpdate" size="small">
            忽略更新
          </el-checkbox>
          <BtnElButton :loading="setting.appUploader.isUpdating" size="small" type="primary" @click="setting.handleAppUpdate()">
            立即更新
          </BtnElButton>
        </div>
      </div>
    </template>
  </el-popover>
  <el-progress
    v-else
    :percentage="progress"
    color="#10cf80"
    :stroke-width="22"
    style="padding: 0 0.8em;text-align: center;height: 2em; width: 6em;"
    striped
    striped-flow
    text-inside
  />
</template>

<style lang="scss" scoped>
#version-toast {
  --at-apply: "bg-transparent p-0 m-0";
}
.preview {
  :deep(#version-toast-preview) {
    font-size: 0.74rem;

    .version-toast-preview-wrapper {
      .task-list-item-checkbox[type="checkbox"] {
        display: none !important;
      }
    }
  }
}
</style>

