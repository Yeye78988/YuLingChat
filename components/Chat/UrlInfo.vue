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
    <p v-if="data.title" class="text-overflow-2 text-0.8em" :title="data.title">
      {{ data.title }}
    </p>
    <div class="mt-1 flex justify-between">
      <small v-if="data.description" class="text-overflow-3 max-w-12em flex-1 text-mini">
        {{ data.description }}
      </small>
      <CardElImage
        v-if="data.image"
        :src="data.image"
        :alt="data.title || '图片'"
        class="h-10 w-10 shrink-0 card-rounded-df object-cover bg-color-2"
        @click.stop.prevent.capture="handleContextMenu"
      />
    </div>
  </a>
</template>

<style scoped>
</style>
