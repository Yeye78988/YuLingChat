<script lang="ts" setup>
import { useRenderMsg } from ".";

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
const emit = defineEmits(["clickAvatar"]);

const chat = useChatStore();
const user = useUserStore();
// 具体
interface TextBodyVO extends TextBodyMsgVO {
  _textTranslation?: Partial<TranslationVO>;
}
const msgId = computed(() => data.message?.id as number | undefined);
const body = computed(() => data.message?.body as Partial<TextBodyVO> | undefined);
const isSelf = user?.userInfo?.id && data?.fromUser?.userId === user?.userInfo?.id;
// 关闭翻译
function clearTranslation() {
  if (body?.value?._textTranslation) {
    closeTranslation(msgId.value as number, body.value._textTranslation.targetLang!);
    body.value._textTranslation = undefined;
  }
}

// 状态计算只在需要时进行
const sendStatus = computed(() => {
  if (typeof data.message.id === "string") {
    return chat.getMsgQueue(data.message.id as any)?.status;
  }
  return undefined;
});

// 计算是否需要显示回复
const showReply = computed(() => !!body.value?.reply);

const urlContentMap = body.value?.urlContentMap || {};
// 计算是否需要显示@提醒
const atUidList = body.value?.atUidList || [];
const showAtMe = computed(() => {
  if (atUidList.length) {
    return atUidList.includes(user.userInfo?.id);
  }
});

// 计算是否需要显示翻译
const showTranslation = computed(() => !!body.value?._textTranslation);

// 渲染消息
const { renderMessageContent } = useRenderMsg(data);
</script>

<template>
  <div class="msg" :class="{ self: isSelf }" v-bind="$attrs">
    <!-- 头像 -->
    <CardElImage
      ctx-name="avatar"
      error-class="i-solar:user-bold-duotone"
      load-class=" "
      :src="BaseUrlImg + data.fromUser.avatar"
      fit="cover"
      class="avatar h-2.4rem w-2.4rem flex-shrink-0 cursor-pointer rounded-1/2 object-cover border-default"
      @click="$emit('clickAvatar', data.fromUser.userId)"
    />
    <!-- 消息体 -->
    <div class="body">
      <!-- 昵称和插槽区域 -->
      <div class="flex-res">
        <small class="nickname flex-1 truncate" ctx-name="nickname">{{ data.fromUser.nickName }}</small>
        <slot name="name-after" />
        <!-- 发送状态 -->
        <ChatMsgSendStatus v-if="sendStatus" :status="sendStatus" :msg-id="data.message.id" />
      </div>

      <!-- 内容 - 使用渲染函数 -->
      <slot name="body" :send-status="sendStatus">
        <p class="msg-popper msg-wrap whitespace-pre-wrap break-words" ctx-name="content">
          <component :is="() => renderMessageContent()" />
        </p>
      </slot>

      <!-- 回复 - 使用v-if减少DOM -->
      <small
        v-if="showReply"
        title="点击跳转"
        ctx-name="reply"
        class="reply"
        @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount, false)"
      >
        <i class="reply-icon i-solar:forward-2-bold-duotone mr-1 p-2" />
        {{ `${body?.reply?.nickName} : ${body?.reply?.body?.substring(0, 50) || ''}` }}
      </small>

      <!-- AT @ - 使用v-if减少DOM -->
      <p
        v-if="urlContentMap"
        ctx-name="urlContentMap"
      >
        <ChatUrlInfo
          v-for="(urlInfo, key) in urlContentMap"
          :key="key"
          :url="String(key)"
          :data="urlInfo"
          class="url-info max-w-16rem min-w-12rem card-rounded-df p-2 shadow-sm transition-200 bg-color-br sm:p-4 hover:(shadow)"
        />
      </p>
      <!-- AT @ - 使用v-if减少DOM -->
      <small
        v-if="showAtMe"
        ctx-name="atUidList"
        class="at-list flex-ml-a"
      >
        有人@我
      </small>

      <!-- 翻译内容 - 使用v-if减少DOM -->
      <div
        v-if="showTranslation"
        key="translation"
        ctx-name="translation"
        class="group translation"
      >
        <div ctx-name="translation" class="mb-2px select-none pb-2px tracking-0.1em border-default-b dark:op-80">
          <i ctx-name="translation" class="i-solar:check-circle-bold mr-1 bg-theme-info p-2.4" />
          {{ body?._textTranslation?.tool?.label || '' }}
          <NuxtLink
            :to="TranslationPagePath"
            ctx-name="translation" class="ml-1 text-theme-info op-80 hover:op-100" title="前往更改"
          >
            {{ translationLangMap.get(body?._textTranslation?.sourceLang) || "自动" }}
            <i ctx-name="translation" class="i-solar:alt-arrow-right-linear mr-1 p-2" />
            {{ translationLangMap.get(body?._textTranslation?.targetLang) || "自动" }}
          </NuxtLink>
          <i ctx-name="translation" class="i-solar:close-circle-bold-duotone float-right p-2.4 btn-danger sm:(op-0 group-hover:op-100)" @click.stop="clearTranslation" />
        </div>
        {{ body?._textTranslation?.result || '' }}
        <svg v-if="body?._textTranslation?.status === 'connecting'" class="inline-block h-1em w-1em animate-spin -mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1" /><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3" /></g></svg>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
