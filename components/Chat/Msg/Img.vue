<script lang="ts" setup>
import { getImgSize } from ".";

/**
 * 图片消息
 */
const props = defineProps<{
  data: ChatMessageVO<ImgBodyMsgVO>
  prevMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
const { data } = toRefs(props);
// 具体
const body: Partial<ImgBodyMsgVO> | undefined = props.data.message?.body || {};
// 计算图片宽高
const { width, height } = getImgSize(body?.width, body?.height);
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
        error-root-class=""
        :src="BaseUrlImg + body?.url"
        :style="{ width, height }"
        load-class="sky-loading block  absolute top-0"
        class="w-fit shadow-sm transition-shadow border-default card-default hover:shadow"
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
:deep(.el-image__wrapper) {
  width: 9rem;
  height: 9rem;
  position: static;
}
</style>
