<script lang="ts" setup>
const props = defineProps<{
  src?: string
  defaultSrc?: string
  loadClass?: string
  loadRootClass?: string
  errorRootClass?: string
  errorClass?: string
  ctxName?: string
  previewSrcList?: string[]
}>();
const setting = useSettingStore();
const src = computed(() => props.defaultSrc ? BaseUrlImg + props.defaultSrc : props.src);
const preLen = computed(() => (props.previewSrcList?.length || 0) > 1);
</script>

<template>
  <el-image
    v-if="src !== `${BaseUrlImg}`"
    :src="src"
    fit="cover"
    hide-on-click-modal
    :close-on-press-escape="!setting.settingPage.isEscMin"
    :draggable="false"
    v-bind="$attrs"
    :preview-src-list="previewSrcList"
    :ctx-name="ctxName"
  >
    <!-- 占位 -->
    <template #placeholder>
      <div :class="loadClass !== undefined ? loadClass : 'sky-loading h-full w-full'" />
    </template>
    <!-- 错误 -->
    <template #error>
      <div :ctx-name="ctxName" class="h-full w-full flex-row-c-c" :class="errorRootClass">
        <i :ctx-name="ctxName" class="icon i-solar-gallery-remove-bold-duotone op-60" :class="errorClass" />
      </div>
    </template>
    <!-- 工具栏 -->
    <template #toolbar="{ actions, prev, next, reset, activeIndex }">
      <el-icon-d-arrow-left
        v-if="preLen"
        class="btn-primary dark:btn-info"
        title="上一张"
        style="width: 1.4rem; height: 1.4rem !important;"
        @click="prev"
      />
      <!-- zoom -->
      <el-icon-zoom-out
        class="btn-primary dark:btn-info"
        title="缩小"
        style="width: 1.4rem; height: 1.4rem !important;"
        @click="actions('zoomOut')"
      />
      <el-icon-zoom-out
        class="btn-primary dark:btn-info"
        title="放大"
        style="width: 1.4rem; height: 1.4rem !important;"
        @click="actions('zoomIn')"
      />
      <!-- rotate -->
      <el-icon-refresh-right
        class="btn-primary dark:btn-info"
        title="向前旋转"
        style="width: 1.4rem; height: 1.4rem !important;"
        @click="actions('clockwise')"
      />
      <!-- reset -->
      <span class="i-tabler:maximize btn-primary dark:btn-info" style="width: 1.4rem; height: 1.4rem !important;" @click="reset" />
      <el-icon-refresh-left
        class="btn-primary dark:btn-info"
        title="重置"
        style="width: 1.4rem; height: 1.4rem !important;"
        @click="actions('anticlockwise')"
      />
      <el-icon-download
        v-if="previewSrcList?.[activeIndex]"
        class="btn-primary dark:btn-info"
        title="保存"
        style="width: 1.4rem; height: 1.4rem;"
        @click="saveImageLocal(previewSrcList?.[activeIndex] as string)"
      />
      <el-icon-d-arrow-right
        v-if="preLen"
        class="btn-primary dark:btn-info"
        title="下一张"
        style="width: 1.4rem; height: 1.4rem !important;"
        @click="next"
      />
    </template>
  </el-image>
  <template v-else>
    <div :ctx-name="ctxName" class="flex-row-c-c text-mini" :class="$attrs.class">
      <i :ctx-name="ctxName" class="icon i-solar-gallery-remove-bold-duotone op-60" :class="errorClass" />
    </div>
  </template>
</template>

<style scoped lang="scss">
.icon {
  --at-apply: "block max-w-4/5 min-h-5 min-w-5 text-gray"
}
</style>
