<script lang="ts" setup>
/**
 * AI问答消息
 */
const { data } = defineProps<{
  data: ChatMessageVO<AiChatBodyMsgVO>
  prevMsg: Partial<ChatMessageVO>
  index: number
}>();
// 具体
const body: Partial<AiChatBodyMsgVO> = data.message?.body || {};
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
      <p v-if="data.message?.content?.trim()" ctx-name="content" class="msg-popper">
        {{ data.message.content }}
      </p>
      <!--  询问的AI -->
      <div
        :title="body.robotInfo?.nickname"
        class="ask-ai flex-ml-a"
      >
        <img
          v-if="body.robotInfo?.avatar"
          :src="BaseUrlImg + body.robotInfo?.avatar"
          class="mr-2 h-4 w-4 flex-shrink-0 rounded-full"
        >
        <span
          v-else
          class="mr-2 h-4 w-4 flex-shrink-0 rounded-full card-bg-color-2"
        />
        {{ body.robotInfo?.nickname }}
      </div>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
