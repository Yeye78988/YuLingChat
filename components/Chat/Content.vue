<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();

const chat = useChatStore();
const setting = useSettingStore();

const msgFormRef = useTemplateRef("msgFormRef");

// const openRoomDrawer = computed({
//   get() {
//     return chat.theContact.type === RoomType.GROUP && setting.isOpenGroupMember;
//   },
//   set(val) {
//     if (chat.theContact.type === RoomType.GROUP)
//       setting.isOpenGroupMember = val;
//   },
// });
</script>

<template>
  <div id="chat-content" class="content flex-1">
    <!-- 房间信息 -->
    <ChatRoomInfo class="relative z-10 shadow-sm border-default-3-b" />
    <!-- 消息列表 -->
    <ChatMessageList @click="msgFormRef?.onClickOutside()" />
    <!-- 发送 -->
    <ChatMsgForm ref="msgFormRef" class="border-default-2-t" />
    <!-- 在线人数 -->
    <Transition name="fade-lr" mode="out-in">
      <div v-if="setting.isOpenGroupMember" class="absolute left-0 top-0 z-998 h-full w-full pt-0 sm:pt-20">
        <div class="model absolute top-0 h-full w-full" @click="setting.isOpenGroupMember = false" />
        <ChatRoomGroupPopup class="ml-a h-full max-w-full flex flex-1 flex-col gap-2 border-l-none p-4 shadow-lg sm:(max-w-17rem shadow-none) !sm:border-default-l bg-color" />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.content {
  --at-apply: "bg-color-2 relative w-full flex flex-col";

  :deep(.el-scrollbar) {
    .el-scrollbar__bar {
      opacity: 0.6;
      .el-scrollbar__thumb:active,
      .el-scrollbar__thumb:hover {
        opacity: 1;
      }
    }
  }
}
</style>


