<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();

const chat = useChatStore();
const setting = useSettingStore();

const msgFormRef = useTemplateRef("msgFormRef");

const openRoomDrawer = computed({
  get() {
    return chat.theContact.type === RoomType.GROUP && setting.isOpenGroupMember;
  },
  set(val) {
    if (chat.theContact.type === RoomType.GROUP)
      setting.isOpenGroupMember = val;
  },
});
</script>

<template>
  <div id="chat-content" class="content flex-1">
    <!-- 房间信息 -->
    <ChatRoomInfo class="relative z-10 shadow-sm card-bg-color" />
    <!-- 消息列表 -->
    <ChatMessageList @click="msgFormRef?.onClickOutside()" />
    <!-- 发送 -->
    <ChatMsgForm ref="msgFormRef" class="card-bg-color-2" />
    <!-- 在线人数 -->
    <Transition name="fade-lr" mode="out-in">
      <div v-if="openRoomDrawer" class="nav-padding-top-10 absolute left-0 top-0 z-998 h-full w-full">
        <div class="model absolute top-0 h-full w-full" @click="openRoomDrawer = false" />
        <ChatRoomGroupPopup class="ml-a h-full max-w-full flex flex-1 flex-col gap-2 rounded-l-3 p-4 sm:(max-w-17rem rounded-l-0 border-l-none) border-default-l bg-color" />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.content {
  --at-apply: "bg-color-3  relative w-full flex flex-col";

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


