<script setup lang="ts">
interface Props {
  data: UrlInfoDTO
  url: string
  ctxName?: string
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
  <a :ctx-name="ctxName" :url="url" class="flex flex-col" target="_blank" :href="url" title="点击查看详情" rel="noopener noreferrer">
    <p :ctx-name="ctxName" :url="url" class="text-overflow-2 text-0.8em leading-1.25em" :title="data.title">
      {{ data.title || "网站名称不可访问" }}
    </p>
    <div :ctx-name="ctxName" :url="url" class="mt-a flex justify-between pt-2">
      <small :ctx-name="ctxName" :url="url" class="text-overflow-3 mr-2 flex-1 text-mini" :title="data.description">
        {{ data.description || "暂无网站具体描述，可能是站内资源" }}
      </small>
      <CardElImage
        :src="data.image"
        alt="查看大图"
        :ctx-name="ctxName" :url="url"
        class="mt-a h-10 w-10 shrink-0 card-rounded-df bg-color-2 object-cover"
        @click.stop.prevent.capture="handleContextMenu"
      />
    </div>
  </a>
</template>

<style scoped>
</style>
