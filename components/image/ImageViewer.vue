<script lang="ts" setup>
import { useLocalStorage } from "@vueuse/core";

interface ShortcutInfo {
  key: string;
  description: string;
}
const setting = useSettingStore();

// 定义快捷键列表
const KEYBOARD_SHORTCUTS: ShortcutInfo[] = [
  { key: "←", description: "上一张图片" },
  { key: "→", description: "下一张图片" },
  { key: "+", description: "放大图片" },
  { key: "-", description: "缩小图片" },
  { key: "r", description: "顺时针旋转" },
  { key: "R", description: "逆时针旋转" },
  { key: "0", description: "重置图片" },
  { key: "Esc", description: "关闭预览" },
  { key: "双击", description: "放大或重置图片" },
];

const keyDownFnMap: Record<string, () => void> = {
  "ArrowLeft": prev,
  "ArrowRight": next,
  "+": zoomIn,
  "-": zoomOut,
  "r": rotateClockwise,
  "R": rotateAnticlockwise,
  "0": resetImage,
  // "Escape": close,
};

// 使用 localStorage 存储用户是否不再显示提示
const hideShortcutTips = useLocalStorage<number | undefined>("image-viewer-hide-shortcut-tips", undefined);

// 控制提示卡片的显示状态
const showShortcutCard = ref(!hideShortcutTips.value);

// 关闭提示但不记住选择
function closeShortcutCard() {
  showShortcutCard.value = false;
}

interface ImageViewerState {
  visible: boolean;
  index: number;
  urlList: string[];
}

const state = reactive<ImageViewerState>({
  visible: false,
  index: 0,
  urlList: [],
});

// 图片操作状态
const imageState = reactive({
  scale: 1,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  moving: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  pinching: false,
  initialDistance: 0,
  initialScale: 1,
});

// 引用图片元素
const imageRef = useTemplateRef<HTMLImageElement>("imageRef");
const containerRef = useTemplateRef<HTMLDivElement>("containerRef");

// 计算当前显示的图片URL
const currentImageUrl = computed(() => {
  if (!state.urlList.length || state.index < 0 || state.index >= state.urlList.length) {
    return "";
  }
  return state.urlList[state.index];
});

// 是否显示上一张/下一张按钮
const showPrev = computed(() => state.urlList.length > 1 && state.index > 0);
const showNext = computed(() => state.urlList.length > 1 && state.index < state.urlList.length - 1);

// 重置图片状态
function resetImage() {
  imageState.scale = 1;
  imageState.rotate = 0;
  imageState.translateX = 0;
  imageState.translateY = 0;
}

// 图片变换样式
const imageStyle = computed(() => {
  return {
    transform: `translate(${imageState.translateX}px, ${imageState.translateY}px) scale(${imageState.scale}) rotate(${imageState.rotate}deg)`,
    transition: imageState.moving || imageState.pinching ? "none" : "transform 0.3s",
  };
});

// 提供给外部的调用方法
const timer = ref();
function open(options: Omit<ImageViewerState, "visible">) {
  state.index = options.index || 0;
  state.urlList = options.urlList || [];
  state.visible = true;
  resetImage();

  // 打开时如果用户没有选择隐藏提示，则显示提示
  if (!hideShortcutTips.value && !setting.isMobileSize) {
    showShortcutCard.value = false;
    clearTimeout(timer.value);
    timer.value = setTimeout(() => {
      showShortcutCard.value = true;
    }, 1000);
  }
}

// 关闭预览
function close() {
  state.visible = false;
}

// 保存图片
function saveImage(url: string) {
  saveImageLocal(url);
}

// 放大
function zoomIn() {
  imageState.scale = Math.min(imageState.scale * 1.2, 10);
}

// 缩小
function zoomOut() {
  imageState.scale = Math.max(imageState.scale / 1.2, 0.1);
}

// 顺时针旋转
function rotateClockwise() {
  imageState.rotate += 90;
}

// 逆时针旋转
function rotateAnticlockwise() {
  imageState.rotate -= 90;
}

// 切换到上一张图片
function prev() {
  if (state.index > 0) {
    state.index--;
    resetImage();
  }
}

// 切换到下一张图片
function next() {
  if (state.index < state.urlList.length - 1) {
    state.index++;
    resetImage();
  }
}

// 处理键盘事件
function handleKeydown(e: KeyboardEvent) {
  if (!state.visible)
    return;
  // 没有其他快捷键
  // if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.key.length > 1)
  //   return;
  keyDownFnMap[e.key]?.();
}

// 鼠标拖动开始
function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0)
    return; // 只处理左键点击

  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡，避免触发容器的点击事件

  imageState.moving = true;
  imageState.startX = e.clientX;
  imageState.startY = e.clientY;
  imageState.lastX = imageState.translateX;
  imageState.lastY = imageState.translateY;

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

// 鼠标拖动中
function handleMouseMove(e: MouseEvent) {
  if (!imageState.moving)
    return;

  const deltaX = e.clientX - imageState.startX;
  const deltaY = e.clientY - imageState.startY;

  imageState.translateX = imageState.lastX + deltaX;
  imageState.translateY = imageState.lastY + deltaY;
}

// 鼠标拖动结束
function handleMouseUp() {
  imageState.moving = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

// 处理鼠标滚轮缩放
function handleWheel(e: WheelEvent) {
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡

  // 向上滚动放大，向下滚动缩小
  if (e.deltaY < 0) {
    zoomIn();
  }
  else {
    zoomOut();
  }
}

// 触摸开始
function handleTouchStart(e: TouchEvent) {
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡

  if (e.touches.length === 1) {
    // 单指拖动
    imageState.moving = true;
    imageState.startX = e.touches[0]?.clientX || 0;
    imageState.startY = e.touches[0]?.clientY || 0;
    imageState.lastX = imageState.translateX;
    imageState.lastY = imageState.translateY;
  }
  else if (e.touches.length === 2) {
    // 双指捏合缩放
    imageState.pinching = true;
    imageState.initialDistance = getDistance(
      e.touches[0]?.clientX || 0,
      e.touches[0]?.clientY || 0,
      e.touches[1]?.clientX || 0,
      e.touches[1]?.clientY || 0,
    );
    imageState.initialScale = imageState.scale;
  }
}

// 触摸移动
function handleTouchMove(e: TouchEvent) {
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡

  if (imageState.moving && e.touches.length === 1) {
    // 单指拖动
    const deltaX = (e.touches[0]?.clientX || 0) - imageState.startX;
    const deltaY = (e.touches[0]?.clientY || 0) - imageState.startY;

    imageState.translateX = imageState.lastX + deltaX;
    imageState.translateY = imageState.lastY + deltaY;
  }
  else if (imageState.pinching && e.touches.length === 2) {
    // 双指捏合缩放
    const touch1X = e.touches[0]?.clientX || 0;
    const touch1Y = e.touches[0]?.clientY || 0;
    const touch2X = e.touches[1]?.clientX || 0;
    const touch2Y = e.touches[1]?.clientY || 0;

    const currentDistance = getDistance(touch1X, touch1Y, touch2X, touch2Y);
    const ratio = currentDistance / imageState.initialDistance;

    // 简单缩放，不考虑中心点
    imageState.scale = Math.min(Math.max(imageState.initialScale * ratio, 0.1), 10);
  }
}

// 触摸结束
function handleTouchEnd() {
  imageState.moving = false;
  imageState.pinching = false;
}

// 计算两点之间的距离
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 双击放大/还原
function handleDoubleClick(e: MouseEvent) {
  e.stopPropagation(); // 阻止事件冒泡

  if (imageState.scale !== 1) {
    resetImage();
  }
  else {
    zoomIn();
  }
}

// 处理背景点击事件
function handleContainerClick(e: MouseEvent) {
  // 仅当点击在容器而不是图片上时关闭预览
  // 检查目标元素是否为图片
  const target = e.target as HTMLElement;
  if (target === containerRef.value && !imageRef.value?.contains(target)) {
    close();
  }
}

// 监听键盘事件
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// 暴露方法给外部使用
defineExpose({
  open,
  close,
});
</script>

<template>
  <DialogPopup
    v-model="state.visible"
    :duration="300"
    :min-scale="0.8"
    :show-close="false"
    :z-index="999"
    destroy-on-close
    content-class="w-full h-full custom-image-viewer"
    :close-on-click-modal="true"
  >
    <!-- 图片显示区域 -->
    <div
      ref="containerRef"
      class="absolute inset-0 z-0 flex items-center justify-center"
      @wheel="handleWheel"
      @click="handleContainerClick"
    >
      <img
        v-if="currentImageUrl"
        ref="imageRef"
        :src="currentImageUrl"
        :style="imageStyle"
        class="max-h-full max-w-full cursor-move select-none object-contain"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @dblclick="handleDoubleClick"
        @click.stop
      >
    </div>

    <!-- 控件容器 - 脱离布局流，确保控件不影响点击遮罩 -->
    <div class="pointer-events-none absolute inset-0 z-10">
      <!-- 关闭按钮 -->
      <div
        class="flex-center pointer-events-auto absolute right-5 top-5 h-10 w-10 cursor-pointer rounded-full text-6 bg-color-br text-color"
        @click="close"
      >
        <i class="i-carbon:close" />
      </div>

      <!-- 工具栏 -->
      <Teleport to="body">
        <div class="pointer-events-auto fixed bottom-10 left-1/2 z-1000 flex transform gap-4 rounded-2 p-2.5 p-x-3.75 -translate-x-1/2 bg-color">
          <el-icon-d-arrow-left
            v-if="showPrev"
            class="btn"
            title="上一张"
            @click.stop="prev"
          />
          <!-- zoom -->
          <el-icon-zoom-in
            class="btn"
            title="放大"
            @click.stop="zoomIn"
          />
          <el-icon-zoom-out
            class="btn"
            title="缩小"
            @click.stop="zoomOut"
          />
          <!-- rotate -->
          <el-icon-refresh-right
            class="btn"
            title="向前旋转"
            @click.stop="rotateClockwise"
          />
          <!-- reset -->
          <span
            class="btn i-tabler:maximize"
            @click.stop="resetImage"
          />
          <el-icon-refresh-left
            class="btn"
            title="重置"
            @click.stop="rotateAnticlockwise"
          />
          <el-icon-download
            v-if="currentImageUrl"
            class="h-1.4rem w-1.4rem btn-primary dark:btn-info"
            title="保存"
            @click.stop="saveImage(currentImageUrl)"
          />
          <el-icon-d-arrow-right
            v-if="showNext"
            class="btn"
            title="下一张"
            @click.stop="next"
          />
        </div>
        <!-- 左右切换箭头 -->
        <div
          v-if="showPrev"
          class="flex-center pointer-events-auto fixed left-5 top-1/2 z-1000 h-12.5 w-12.5 transform cursor-pointer rounded-full text-7.5 -translate-y-1/2 bg-color-br text-color"
          @click.stop="prev"
        >
          <i class="i-carbon:chevron-left" />
        </div>
        <div
          v-if="showNext"
          class="flex-center pointer-events-auto fixed right-5 top-1/2 z-1000 h-12.5 w-12.5 transform cursor-pointer rounded-full text-7.5 -translate-y-1/2 bg-color-br text-color"
          @click.stop="next"
        >
          <i class="i-carbon:chevron-right" />
        </div>
        <!-- 图片计数 -->
        <div
          v-if="state.urlList.length > 1"
          class="pointer-events-auto fixed left-5 top-5 z-1000 rounded-1 px-2.5 py-1.25 text-3.5 bg-color text-color"
        >
          {{ state.index + 1 }} / {{ state.urlList.length }}
        </div>
      </Teleport>
      <!-- 快捷键提示卡片 -->
      <transition name="fade">
        <div
          v-if="showShortcutCard && !setting.isMobileSize"
          class="pointer-events-auto absolute left-2 top-2 w-12rem select-none card-rounded-df text-sm sm:(left-4 top-4 w-12rem) bg-color-br"
        >
          <div class="mb-2 flex-row-bt-c px-3 py-2 border-default-2-b">
            <h4 class="text-3.5">
              <i class="i-carbon:keyboard mr-2 p-2.6" />
              快捷键
            </h4>
            <i class="i-carbon:close cursor-pointer p-2.6 hover:opacity-70" @click="closeShortcutCard" />
          </div>
          <div class="px-3 py-2 leading-1.6em border-default-2-b text-mini">
            <div v-for="shortcut in KEYBOARD_SHORTCUTS" :key="shortcut.key" class="flex-row-bt-c">
              <span>{{ shortcut.key }}</span>
              <span>{{ shortcut.description }}</span>
            </div>
          </div>
          <div class="flex-row-bt-c px-3 py-2">
            <el-checkbox v-model="hideShortcutTips" size="small" class="mr-1">
              不再提醒
            </el-checkbox>
            <span
              class="text-xs btn-primary"
              @click="closeShortcutCard"
            >知道了</span>
          </div>
        </div>
      </transition>
    </div>
  </DialogPopup>
</template>

<style lang="scss">
.btn {
  --at-apply: "w-1.4rem h-1.4rem! btn-primary dark:btn-info";
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
