<script lang="ts" setup>
import { ChatRoomRoleEnum } from "~/composables/api/chat/room";

type EditFormItems = "name" | "notice" | "";

// store
const chat = useChatStore();
const setting = useSettingStore();
const user = useUserStore();

// ref
const searchInputRef = useTemplateRef("searchInputRef");
const noticeInputRef = useTemplateRef("noticeInputRef");
const nameInputRef = useTemplateRef("nameInputRef");

// data
const editFormFieldRaw = ref<EditFormItems>("");
const editFormField = computed<EditFormItems>({
  get() {
    return editFormFieldRaw.value;
  },
  set(val) {
    editFormFieldRaw.value = val;
    nextTick(() => {
      if (val === "notice" && noticeInputRef.value)
        noticeInputRef?.value?.focus();
      else if (val === "name" && nameInputRef.value)
        nameInputRef?.value?.focus();
    });
  },
});

const {
  showSearch,
  isTheGroupOwner,
  isNotExistOrNorFriend,
  theContactClone,
  searchUserWord,
  imgList,
  isLord,
  vMemberList,
  inputOssFileUploadRef,
  containerProps,
  wrapperProps,
  isReload,
  isLoading,
  onSubmitImages,
  toggleImage,
  submitUpdateRoom,
  onScroll,
  scrollTo,
  onMemberContextMenu,
  onExitOrClearGroup,
} = useRoomGroupPopup({
  editFormField,
  overscan: 10,
  itemHeight: 44,
});
// 邀请进群
function showJoinGroup() {
  chat.inviteMemberForm = {
    show: true,
    roomId: chat.theRoomId!,
    uidList: [],
  };
};

const isPin = computed(() => !!chat.theContact?.pinTime);
const isPinLoading = ref(false);
async function changIsPin() {
  isPinLoading.value = true;
  try {
    const val = isPin.value ? isTrue.FALESE : isTrue.TRUE;
    await chat.setPinContact(chat.theRoomId!, val);
    return !!val;
  }
  finally {
    isPinLoading.value = false;
  }
}
const shieldStatus = computed(() => chat.theContact?.shieldStatus === isTrue.TRUE);
const shieldStatusLoading = ref(false);
async function changShieldStatus() {
  shieldStatusLoading.value = true;
  try {
    const val = chat.theContact?.shieldStatus === isTrue.TRUE ? isTrue.FALESE : isTrue.TRUE;
    await chat.setShieldContact(chat.theRoomId!, val);
    return !!val;
  }
  finally {
    shieldStatusLoading.value = false;
  }
}
</script>

<template>
  <el-scrollbar
    v-if="setting.isOpenGroupMember && chat.theContact.type === RoomType.GROUP"
    v-bind="$attrs"
    class="group scroll relative"
    wrap-class="pb-20"
  >
    <div sticky left-0 top-0 z-10 flex-row-bt-c flex-shrink-0 flex-row truncate px-2 pb-2 bg-color>
      <i
        class="i-solar:magnifer-linear block h-4.5 w-4.5 btn-info"
        @click="() => {
          showSearch = !showSearch
          if (showSearch) {
            searchInputRef?.focus?.()
          }
        }"
      />
      <small>群成员</small>
      <div class="rounded-2rem p-1.5" @click="showJoinGroup">
        <i class="block h-1.8em h-5 w-1.8em w-5 rounded-2rem btn-info border-default" i-carbon:add-large />
      </div>
    </div>
    <!-- 搜索群聊 -->
    <div
      class="header sticky left-0 top-10 z-10 h-10 transition-height bg-color"
      :class="!showSearch ? '!h-0 overflow-y-hidden' : ''"
    >
      <ElInput
        ref="searchInputRef"
        v-model.lazy="searchUserWord"
        style="height: 1.8rem;"
        name="search-content"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        placeholder="搜索群成员"
        @blur.stop="() => searchUserWord === '' && (showSearch = false)"
        @input="scrollTo(0)"
      />
    </div>
    <div relative h-300px>
      <div
        v-bind="containerProps"
        class="scroll-bar relative !h-300px"
        @scroll="onScroll"
      >
        <div
          v-bind="wrapperProps"
          class="relative"
        >
          <div
            v-for="p in vMemberList"
            :key="`${chat.theRoomId!}_${p.data.userId}`"
            :class="p.data.activeStatus === ChatOfflineType.ONLINE ? 'live' : 'op-60 filter-grayscale filter-grayscale-100 '"
            class="user-card"
            @dblclick="onMemberContextMenu($event, p.data)"
            @contextmenu="onMemberContextMenu($event, p.data)"
            @click="setting.isMobileSize && onMemberContextMenu($event, p.data)"
          >
            <div class="relative flex-row-c-c" :title="p.data.nickName || '未知'">
              <CardElImage
                :default-src="p.data.avatar" fit="cover"
                error-class="i-solar-user-line-duotone p-2 op-80"
                class="h-2rem w-2rem flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default"
              />
              <span class="g-avatar" />
            </div>
            <small truncate>{{ p.data.nickName || "未填写" }}</small>
            <div class="tags ml-a block pl-1">
              <el-tag v-if="p.data.userId === user.userInfo.id" class="mr-1" style="font-size: 0.6em;border-radius: 2rem;" size="small" type="warning">
                我
              </el-tag>
              <el-tag v-if="p.data.roleType !== null && p.data.roleType !== ChatRoomRoleEnum.MEMBER" class="mr-1" style="font-size: 0.6em;border-radius: 2rem;" size="small" effect="dark" type="info">
                {{ ChatRoomRoleEnumMap[p.data.roleType || ChatRoomRoleEnum.MEMBER] }}
              </el-tag>
            </div>
          </div>
          <!-- loading -->
          <div v-show="isLoading && !isReload" class="flex-row-c-c text-mini">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin select-none" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1" /><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3" /></g></svg>
            &nbsp;加载中...
          </div>
        </div>
      <!-- <small
        class="shadow-linear fixed bottom-0 left-0 block h-2em w-full cursor-pointer text-center"
        @click="scrollTo(chat.currentMemberList.length - 1)"
      >
        <i i-solar:alt-arrow-down-outline p-2 btn-info />
      </small> -->
      </div>
    </div>
    <div class="mt-4 w-full flex-1 select-none overflow-y-auto text-3.5 leading-1.8em border-default-t">
      <div relative mt-3>
        群头像
        <InputOssFileUpload
          ref="inputOssFileUploadRef"
          :is-animate="false"
          :show-edit="false"
          :disable="!isLord"
          :multiple="false"
          :limit="1"
          input-class="w-3rem mt-1 h-3rem flex-shrink-0 card-default"
          :class="!isLord ? 'cursor-no-drop' : 'cursor-pointer'"
          :upload-quality="0.3"
          :model-value="imgList"
          @click="toggleImage"
          @error-msg="(msg:string) => {
            ElMessage.error(msg)
          }"
          @submit="onSubmitImages"
        />
      </div>
      <div mt-3 class="label-item">
        <span select-none>群聊名称</span>
        <i v-show="isLord && editFormField !== 'name'" i-solar:pen-2-bold ml-2 p-2 op-0 transition-opacity @click="editFormField = 'name'" />
        <div
          class="dark:op-70" @click="() => {
            if (isLord && editFormField !== 'name') {
              editFormField = 'name'
            }
          }"
        >
          <el-input
            v-if="theContactClone"
            ref="nameInputRef"
            v-model.lazy="theContactClone.name"
            :disabled="!isLord || editFormField !== 'name'"
            type="text"
            :maxlength="30"
            style="width: fit-content;"
            placeholder="未填写"
            @focus="editFormField = 'name'"
            @keydown.enter="submitUpdateRoom('name', theContactClone.name)"
            @blur.stop="submitUpdateRoom('name', theContactClone.name)"
          />
        </div>
      </div>
      <div class="label-item">
        <div mt-3 select-none>
          群公告
          <i v-show="isLord && editFormField !== 'notice'" i-solar:pen-2-bold ml-2 p-2 op-0 transition-opacity @click="editFormField = 'notice'" />
        </div>
        <textarea
          v-if="theContactClone?.roomGroup?.detail"
          ref="noticeInputRef"
          v-model="theContactClone.roomGroup.detail.notice"
          :disabled="!isLord || editFormField !== 'notice'"
          :rows="editFormField === 'notice' ? 8 : 1"
          :maxlength="200"
          class="scroll-bar mt-2 card-rounded-df border-none transition-200 bg-color"
          type="textarea"
          style="resize:none;width: 100%;"
          placeholder="未填写"
          @focus="editFormField = 'notice'"
          @keydown.enter.stop="submitUpdateRoom('notice', theContactClone?.roomGroup?.detail?.notice)"
          @blur="submitUpdateRoom('notice', theContactClone?.roomGroup?.detail?.notice)"
        />
      </div>
      <div class="label-item mt-3 select-none">
        会话设置
        <div class="mt-2 card-rounded-df">
          <div mb-2 flex-row-bt-c pb-2 border-default-b>
            设为置顶
            <el-switch
              :model-value="isPin"
              size="small"
              :loading="isPinLoading"
              :before-change="changIsPin"
            />
          </div>
          <div flex-row-bt-c>
            消息免打扰
            <el-switch
              :model-value="shieldStatus"
              :loading="shieldStatusLoading"
              size="small"
              :before-change="changShieldStatus"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 退出 -->
    <btn-el-button
      v-show="!chat.contactMap[chat.theRoomId!]?.hotFlag" v-memo="[isNotExistOrNorFriend, isTheGroupOwner]" icon-class="i-solar:logout-3-broken mr-2"
      type="danger"
      plain
      class="mt-6 w-full"
      @click="onExitOrClearGroup"
    >
      <span>
        {{ isNotExistOrNorFriend ? '不显示聊天' : isTheGroupOwner ? '解散群聊' : '退出群聊' }}
      </span>
    </btn-el-button>
    <!-- 渐变色 -->
    <div class="shadow-linear absolute bottom-0 left-0 z-1 block h-20 w-full w-full cursor-pointer text-center" />
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.g-avatar {
  --at-apply: "border-default z-1 absolute bottom-0.2em right-0.2em rounded-full block w-2 h-2 ";
}
.user-card {
  --at-apply: "h-44px flex-shrink-0 cursor-pointer flex-row-c-c p-1.5 relative gap-2 truncate rounded-2rem filter-grayscale w-full hover:(bg-color-2 op-100)";
  .tags {
    :deep(.el-tag) {
      transition: none;
    }
  }
}

.is-grid {
    // grid-template-columns: repeat(auto-fit, minmax(3em, 1fr)); // 设置网格布局，并设置列数为自动适应，每个列的宽度为1fr（占据可用空间）
  .user-card {
    --at-apply:'sm:mx-0 mx-a';
    width: fit-content;
  }
}

.live {
  .g-avatar {
    background-color: var(--el-color-info);
  }
  filter: none;
}
:deep(.el-scrollbar__thumb) {
  opacity: 0.5;
}
.label-item {
  :deep(.el-input) {
    .el-input__wrapper {
      background: transparent;
      box-shadow: none;
      color: inherit !important;
      padding: 0;
    }
    .el-input__inner {
      color: inherit !important;
      caret-color: var(--el-color-info);
      cursor: pointer;
    }
  }
  &:hover i {
    opacity: 1;
    cursor: pointer
  }
}
:deep(.el-textarea) {
  .el-textarea__inner {
    color: inherit !important;
    caret-color: var(--el-color-info);
    box-shadow: none;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    resize:none;
  }
  &.is-disabled {
    box-shadow: none;
    resize:none;
  }
}
.shadow-linear {
  // 渐变色
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
}
.dark .shadow-linear {
  background: linear-gradient(to bottom, rgba(31, 31, 31, 0) 0%, rgba(31, 31, 31, 1) 100%);
}

.header {
  :deep(.el-input) {
    .el-input__wrapper {
      --at-apply: "!shadow-none text-sm !outline-none input-bg-color";
    }
  }
  .icon {
    --at-apply: "h-2rem w-2rem flex-row-c-c btn-primary-bg  input-bg-color";
  }
}
.scroll {
  :deep(.el-scrollbar__thumb) {
    display: none;
  }
}
</style>
