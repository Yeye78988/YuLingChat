<script lang="ts" setup>
import { ChatAIEllipsisBody } from "#components";
import { MdPreview } from "md-editor-v3";

/**
 * AI问答消息
 */
const {
  data,
} = defineProps<{
  data: ChatMessageVO<AiChatBodyMsgVO>
  prevMsg: Partial<ChatMessageVO>
  index: number
}>();
const chat = useChatStore();
const body: Partial<AiChatBodyMsgVO> = data.message?.body || {};
const initFold = data.message?.content?.length && data.message?.content?.length > 200 && chat.theContact.lastMsgId !== data.message.id;
const isFold = ref(initFold);
</script>

<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
    class="group"
  >
    <template #body>
      <!-- 内容 -->
      <div class="ai-reply-msg-popper relative min-h-2.5em min-w-2.6em">
        <component
          :is="isFold ? ChatAIEllipsisBody : MdPreview"
          :id="`msg-md-${data.message.id}`"
          language="zh-CN"
          show-code-row-number
          :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
          code-theme="a11y"
          :code-foldable="false"
          ctx-name="content"
          class="markdown-preivew"
          :model-value="data.message?.content"
          @toggle="(val: boolean) => (isFold = val)"
        />
      </div>
      <!--  询问的AI -->
      <div class="flex-ml-a flex items-center">
        <span
          v-if="initFold"
          class="ask-ai mx-2 flex-shrink-0 btn-info text-small sm:(op-0 group-hover:op-100)"
          @click="isFold = !isFold"
        >
          收起
          <i i-solar:alt-arrow-up-line-duotone p-2 />
        </span>
        <span
          :title="body.robotInfo?.nickname"
          class="ask-ai"
        >
          <img
            v-if="body.robotInfo?.avatar"
            :src="BaseUrlImg + body.robotInfo?.avatar"
            class="mr-2 h-4 w-4 flex-shrink-0 rounded-full"
          >
          {{ body.robotInfo?.nickname }}
        </span>
      </div>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';

.markdown-preivew {
  --at-apply: "text-0.9rem p-0 bg-color";
  // line-height: initial !important;
  font-size: inherit;

  :deep(.md-editor-preview-wrapper) {
    color: inherit;
    padding: 0 !important;
    font-size: inherit;

    .md-editor-preview {
      color: var(--el-text-color-primary);
      font-size: inherit;

      img {
        border-radius: 0.25rem;
        overflow: hidden;
        max-width: 12rem !important;
        max-height: 12rem !important;
      }

      p {
        margin: 0.4em 0;
      }

      p:not(p:last-of-type) {
        margin: 0.4em 0 0 0;
      }

      p:nth-child(1) {
        margin: 0 !important;
      }

      .md-editor-code {
        line-height: 1.6;
        --at-apply: 'm-0 mt-2 flex flex-col overflow-hidden card-bg-color-2 rounded-3 border-default shadow-(md inset)';

        .md-editor-code-block {
          font-size: 0.8em;
          font-size: inherit;
          line-height: 1.6;

          &~span[rn-wrapper]>span {
            font-size: 0.8em;
            line-height: 1.6;
            font-size: inherit;
          }
        }
        code {
          border-radius: 0 0 8px 8px;
        }
      }
      .md-editor-code:first-child {
        --at-apply: 'my-1';
        border-radius: 6px 1em 1em 1em;
      }
    }
  }
}
.is-reson-open .text {
  --at-apply: "bg-color-br";
}
</style>
