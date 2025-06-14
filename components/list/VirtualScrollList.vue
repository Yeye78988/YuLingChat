<script setup lang="ts">
// 接口定义
interface Props {
  items?: any[]
  itemHeight?: number
  maxHeight?: string
  wrapClass?: string
  className?: string
  itemClass?: string
  activeClass?: string
  selectedIndex?: number
  overscan?: number
  getItemKey?: (item: any, index: number) => string | number
}

interface Emits {
  (e: "itemClick", item: any, index: number): void
  (e: "itemHover", item: any, index: number): void
  (e: "update:selectedIndex", index: number): void
  (e: "scroll", event: { scrollTop: number; scrollLeft: number }): void
}

// Props 解构
const props = withDefaults(defineProps<Props>(), {
  itemHeight: 32,
  maxHeight: "12rem",
  wrapClass: "px-1.5",
  className: "py-1.5",
  itemClass: "",
  activeClass: "active",
  selectedIndex: -1,
  overscan: 10,
  items: () => [],
  getItemKey: (item: any, index: number) => item.id || item.userId || index,
});

const emit = defineEmits<Emits>();
const scrollbarRef = useTemplateRef("scrollbarRef");
// 创建虚拟列表逻辑
function useVirtualList() {
  const containerHeight = ref(250);
  const scrollTop = ref(0);

  // 工具函数：解析高度字符串
  function parseHeight(height: string): number {
    if (height.endsWith("rem")) {
      return Number.parseFloat(height) * 16;
    }
    if (height.endsWith("px")) {
      return Number.parseFloat(height);
    }
    if (height.endsWith("vh")) {
      return (Number.parseFloat(height) * window.innerHeight) / 100;
    }
    const numValue = Number.parseFloat(height);
    return Number.isNaN(numValue) ? 250 : numValue;
  }

  // 监听 maxHeight 变化
  watch(() => props.maxHeight, (newHeight) => {
    containerHeight.value = parseHeight(newHeight);
  }, { immediate: true });

  // 计算起始索引 - 参考代码简化版
  const startIndex = computed(() => {
    return Math.floor(scrollTop.value / props.itemHeight);
  });

  // 计算结束索引 - 参考代码逻辑
  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight.value / props.itemHeight);
    return Math.min(startIndex.value + visibleCount + props.overscan, props.items.length);
  });

  // 计算可见项目列表 - 参考代码逻辑，添加前置缓冲
  const visibleItems = computed(() => {
    const result = [];
    const start = Math.max(0, startIndex.value - Math.floor(props.overscan / 2));

    for (let i = start; i < endIndex.value; i++) {
      if (props.items[i]) {
        result.push({
          index: i,
          data: props.items[i],
          top: i * props.itemHeight,
        });
      }
    }
    return result;
  });

  // 计算总高度
  const totalHeight = computed(() => {
    return props.items.length * props.itemHeight;
  });

  // 滚动事件处理
  function onScroll(event: { scrollTop: number; scrollLeft: number }) {
    scrollTop.value = event.scrollTop;
    emit("scroll", event);
  }

  // 滚动到指定项
  function scrollToItem(index: number) {
    if (!scrollbarRef.value || index < 0 || index >= props.items.length) {
      return;
    }

    const targetScrollTop = index * props.itemHeight;
    scrollTop.value = targetScrollTop;

    nextTick(() => {
      // 查找对应的DOM元素并滚动到视图中
      const itemElement = scrollbarRef.value?.wrapRef?.querySelector(`[data-index="${index}"]`);
      if (itemElement) {
        itemElement.scrollIntoView({
          block: "nearest",
        });
      }
      else {
        // 如果找不到元素，回退到scrollTo方法
        scrollbarRef.value?.wrapRef?.scrollTo({
          top: targetScrollTop,
        });
      }
    });
  }

  return {
    containerHeight,
    scrollTop,
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    onScroll,
    scrollToItem,
  };
}

// 使用虚拟列表逻辑
const {
  containerHeight,
  scrollTop,
  startIndex,
  endIndex,
  visibleItems,
  totalHeight,
  onScroll,
  scrollToItem,
} = useVirtualList();

// 计算是否有数据
const hasItems = computed(() => {
  return props.items.length > 0;
});

// 处理点击事件
function handleItemClick(item: any, index: number) {
  emit("itemClick", item, index);
  emit("update:selectedIndex", index);
}

// 处理鼠标悬停事件
function handleItemHover(item: any, index: number) {
  emit("itemHover", item, index);
}

// 滚动到选中项
function scrollToSelectedItem() {
  if (props.selectedIndex >= 0) {
    scrollToItem(props.selectedIndex);
  }
}

// 获取当前滚动位置
function getScrollTop(): number {
  return scrollTop.value;
}

// 设置滚动位置
function setScrollTop(newScrollTop: number) {
  const maxScrollTop = Math.max(0, totalHeight.value - containerHeight.value);
  const clampedScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));

  scrollTop.value = clampedScrollTop;
  if (scrollbarRef.value?.wrapRef) {
    scrollbarRef.value.wrapRef.scrollTop = clampedScrollTop;
  }
}

// 滚动到顶部
function scrollToTop() {
  setScrollTop(0);
}

// 滚动到底部
function scrollToBottom() {
  setScrollTop(totalHeight.value);
}

// 获取当前可见项目信息
function getVisibleRange() {
  return {
    startIndex: startIndex.value,
    endIndex: endIndex.value,
    visibleCount: endIndex.value - startIndex.value,
  };
}

// 监听项目数据变化
watch(() => props.items.length, (newLength) => {
  if (newLength === 0) {
    scrollTop.value = 0;
  }
  else if (scrollTop.value > newLength * props.itemHeight) {
    setScrollTop(Math.max(0, newLength * props.itemHeight - containerHeight.value));
  }
});

// 监听项目高度变化
watch(() => props.itemHeight, () => {
  const currentVisibleIndex = Math.floor(scrollTop.value / props.itemHeight);
  nextTick(() => {
    scrollToItem(currentVisibleIndex);
  });
});

// 暴露方法给父组件
defineExpose({
  scrollToItem,
  scrollToSelectedItem,
  getScrollTop,
  setScrollTop,
  scrollToTop,
  scrollToBottom,
  getVisibleRange,
  scrollbarRef,
});
</script>

<template>
  <el-scrollbar
    ref="scrollbarRef"
    :max-height="maxHeight"
    :wrap-class="wrapClass"
    :class="className"
    @scroll="onScroll"
  >
    <!-- 空状态插槽 -->
    <template v-if="!hasItems">
      <slot name="empty">
        <div class="flex items-center justify-center py-8 text-gray-500">
          暂无数据
        </div>
      </slot>
    </template>

    <!-- 虚拟列表容器 -->
    <div
      v-else
      :style="{
        height: `${totalHeight}px`,
        position: 'relative',
      }"
    >
      <!-- 可见项目 -->
      <div
        v-for="item in visibleItems"
        :key="getItemKey(item.data, item.index)"
        :data-index="item.index"
        :style="{
          position: 'absolute',
          top: `${item.top}px`,
          left: 0,
          right: 0,
          height: `${itemHeight}px`,
          display: 'flex',
          alignItems: 'center',
        }"
        :class="[
          itemClass,
          { [activeClass]: item.index === selectedIndex },
        ]"
        @click="handleItemClick(item.data, item.index)"
        @mouseover="handleItemHover(item.data, item.index)"
      >
        <!-- 默认插槽 -->
        <slot
          name="default"
          :item="item.data"
          :index="item.index"
          :is-active="item.index === selectedIndex"
        />
      </div>
    </div>
  </el-scrollbar>
</template>

<style scoped>
/* 组件默认样式 */
.virtual-list-item {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.virtual-list-item:hover {
  background-color: var(--el-fill-color-light);
}

.virtual-list-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
