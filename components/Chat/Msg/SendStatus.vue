<script lang="ts" setup>
const {
  status,
} = defineProps<{
  status: MessageSendStatus
  msgId: any
}>();
const chat = useChatStore();
const titleMap: Record<MessageSendStatus, { title: string, className?: string, closeName?: string }> = {
  [MessageSendStatus.ERROR]: {
    title: "发送失败，点击重试",
    className: "i-solar:refresh-linear  bg-theme-danger hover:rotate-180 btn-danger",
    closeName: "i-solar:trash-bin-minimalistic-2-line-duotone  btn-danger cursor-pointer",
  },
  [MessageSendStatus.PENDING]: {
    title: "待发送",
    className: "i-solar:clock-circle-line-duotone op-60",
  },
  [MessageSendStatus.SENDING]: {
    title: "发送中...",
    className: "i-tabler:loader-2 animate-spin op-40",
  },
  [MessageSendStatus.SUCCESS]: {
    title: "",
  },
};
const types = computed(() => titleMap[status as MessageSendStatus]);
function confirmDeleteMessage(event: MouseEvent, msgId: any) {
  ElMessageBox.confirm(
    "确定删除此消息吗？",
    "删除消息",
    {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
      center: true,
    },
  ).then(() => {
    // 确认删除消息
    chat.deleteUnSendMessage(msgId);
  }).catch(() => {
    // 用户取消操作
  });
}
</script>

<template>
  <i
    v-if="status"
    :title="types?.title"
    class="my-a inline-block h-4.5 w-4.5"
    :class="types?.className"
    @click="chat.retryMessage(msgId)"
  />
  <i
    v-if="status && types?.closeName"
    :title="types?.closeName"
    class="my-a inline-block h-4.5 w-4.5"
    :class="types?.closeName"
    @click="confirmDeleteMessage($event, msgId)"
  />
</template>

<style lang="scss" scoped>
</style>
