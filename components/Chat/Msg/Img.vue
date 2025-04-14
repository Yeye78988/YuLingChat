<script lang="ts" setup>
import { getImgSize } from ".";

/**
 * 图片消息
 */
const {
  data,
} = defineProps<{
  data: ChatMessageVO<ImgBodyMsgVO>
  prevMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
// 具体
const body: Partial<ImgBodyMsgVO> & { showWidth?: string, showHeight?: string } = data.message?.body || {};
// 计算图片宽高
const { width, height } = getImgSize(body?.width, body?.height);
body.showWidth = width;
body.showHeight = height;
</script>

<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <!-- 内容 -->
      <CardElImage
        v-if="body?.url"
        ctx-name="img"
        :src="BaseUrlImg + body?.url"
        :style="{ width, height }"
        load-class="sky-loading block absolute top-0"
        class="max-h-50vh max-w-76vw shadow-sm transition-shadow md:(max-h-18rem max-w-18rem) border-default-2 card-default hover:shadow"
        preview-teleported
        :alt="body?.url"
        :preview-src-list="[BaseUrlImg + body?.url]"
      />
      <!-- 内容 -->
      <p v-if="data.message?.content?.trim()" ctx-name="content" class="msg-popper msg-wrap">
        {{ data.message.content }}
      </p>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
