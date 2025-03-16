<script lang="ts" setup>
// import { dayjs } from "element-plus";

/**
 * 消息模板（默认文本）
 * ctx-name 用于右键菜单
 */
const { data } = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO | ImgBodyMsgVO | RtcBodyMsgVO | AiChatBodyMsgVO | GroupNoticeBodyMsgVO | AiChatReplyBodyMsgVO>;
  prevMsg?: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
defineEmits(["clickAvatar"]);

const chat = useChatStore();
const user = useUserStore();
// 具体
interface TextBodyVO extends TextBodyMsgVO {
  translation?: Partial<TranslationVO>;
}
const msgId = data.message?.id;
const body = computed(() => data.message?.body as Partial<TextBodyVO> | undefined);
const isSelf = user?.userInfo?.id && data?.fromUser?.userId === user?.userInfo?.id;
// 关闭翻译
function clearTranslation() {
  if (body?.value?.translation) {
    closeTranslation(msgId, body.value.translation.targetLang!);
    body.value.translation = undefined;
  }
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="msg"
    :class="{
      self: isSelf,
    }"
  >
    <!-- 头像 -->
    <CardElImage
      ctx-name="avatar"
      error-class="i-solar:user-bold-duotone"
      :src="BaseUrlImg + data.fromUser.avatar"
      fit="cover"
      class="avatar h-2.4rem w-2.4rem flex-shrink-0 cursor-pointer rounded-1/2 object-cover border-default"
      @click="$emit('clickAvatar', data.fromUser.userId)"
    />
    <!-- 消息体 -->
    <div class="body">
      <div class="flex-res">
        <!-- 昵称 -->
        <small class="nickname flex-1 truncate" ctx-name="nickname">
          {{ data.fromUser.nickName }}
        </small>
        <!-- 插槽 -->
        <slot name="name-after" />
        <!-- <small class="sendTime text-0.7em op-0" ctx-name="sendTime">
          {{ dayjs(data.message.sendTime).format("YYYY-MM-DD HH:mm:ss") }}
        </small> -->
      </div>
      <!-- 内容 -->
      <slot name="body">
        <p class="msg-popper msg-wrap" ctx-name="content">
          {{ data.message.content }}
        </p>
      </slot>
      <!-- 回复 -->
      <small
        v-if="body?.reply"
        title="点击跳转"
        ctx-name="reply"
        class="reply"
        @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount, false)"
      >
        <i class="i-solar:forward-2-bold-duotone mr-1 p-2" />
        {{ `${body.reply.nickName} : ${body.reply?.body?.substring(0, 50) || ''}` }}
      </small>
      <!-- AT @ -->
      <small
        v-if="body?.atUidList?.length && body?.atUidList.includes(user?.userInfo?.id)"
        ctx-name="atUidList"
        class="at-list flex-ml-a"
      >
        有人@我
      </small>
      <!-- 翻译内容 -->
      <div
        v-if="body?.translation"
        key="translation"
        ctx-name="translation"
        class="translation group"
      >
        <div ctx-name="translation" class="mb-2px select-none pb-2px tracking-0.1em border-default-b dark:op-80" @click="clearTranslation">
          <i ctx-name="translation" class="i-solar:check-circle-bold mr-1 bg-theme-info p-2.4" />
          {{ body?.translation?.tool?.label || '' }}
          <i ctx-name="translation" class="i-solar:close-circle-bold-duotone float-right p-2.4 btn-danger sm:(op-0 group-hover:op-100)" />
        </div>
        {{ body?.translation?.result || '' }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
