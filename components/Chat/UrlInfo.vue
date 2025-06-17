<script setup lang="ts">
interface Props {
  data: UrlInfoDTO
  url: string
}

const { data } = defineProps<Props>();

function handleContextMenu() {
  if (!data.image)
    return;
  useImageViewer.open({
    urlList: [data.image],
    initialIndex: 0,
  });
}
</script>

<template>
  <a class="flex flex-col" target="_blank" :href="url" title="点击查看详情" rel="noopener noreferrer">
    <p class="text-overflow-2 text-0.8em" :title="data.title">
      {{ data.title || "网站名称不可访问" }}
    </p>
    <div class="mt-1 flex justify-between">
      <small class="text-overflow-3 mr-2 flex-1 text-mini">
        {{ data.description || "暂无网站具体描述，可能是站内资源" }}
      </small>
      <CardElImage
        :src="data.image"
        alt="查看大图"
        class="h-10 w-10 shrink-0 card-rounded-df object-cover bg-color-2"
        @click.stop.prevent.capture="handleContextMenu"
      />
    </div>
  </a>
</template>

<style scoped>
</style>
