import type { ElScrollbar } from "element-plus";

const requestAnimationFrameFn = window?.requestAnimationFrame || (callback => setTimeout(callback, 16));
/**
 * 消息列表 Hook
 * 提供消息列表相关的功能
 */
export function useMessageList(scrollbarRefName = "scrollbarRef") {
  const chat = useChatStore();
  const user = useUserStore();
  const setting = useSettingStore();

  // 消息
  const pageInfo = computed({
    get: () => chat?.theContact?.pageInfo || {},
    set: (val: PageInfo) => {
      if (chat.theContact)
        chat.theContact.pageInfo = val;
    },
  });

  const isLoading = computed({
    get: () => !!chat?.theContact?.isLoading,
    set: (val: boolean) => {
      if (!chat.theContact)
        return;
      chat.theContact.isLoading = val;
    },
  });

  const isReload = computed({
    get: () => !!chat?.theContact?.isReload,
    set: (val: boolean) => {
      if (!chat.theContact)
        return;
      chat.theContact.isReload = val;
    },
  });

  // 滚动
  type ScrollbarRefType = InstanceType<typeof ElScrollbar>;
  const scrollbarRef = useTemplateRef<ScrollbarRefType>(scrollbarRefName);
  const timer = ref<any>(0);

  /**
   * 加载数据
   */
  async function loadData(roomId?: number, call?: (data?: ChatMessageVO[]) => void) {
    roomId = roomId || chat.theRoomId;
    if (!roomId || !pageInfo.value) {
      return;
    }
    if (isLoading.value || isReload.value || pageInfo.value.isLast || !roomId)
      return;
    if (chat.isMsgListScroll) {
      return;
    }
    isLoading.value = true;
    const res = await getChatMessagePage(roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken).catch(() => {
      isLoading.value = false;
      pageInfo.value.isLast = false;
      pageInfo.value.cursor = undefined;
    });
    if (res?.code !== StatusCode.SUCCESS) {
      console.warn("加载消息失败");
      return;
    }
    const data = res.data;
    if (roomId !== chat.theRoomId || !chat.theContact)
      return;
      // 追加数据
    if (data?.list && data.list.length)
      chat?.theContact?.msgList?.unshift?.(...data.list);
    const oldSize = chat.scrollTopSize;
    nextTick(() => {
      // 更新滚动位置
      if (!chat.theContact)
        return;
      chat.saveScrollTop && chat.saveScrollTop();
      if (pageInfo.value.cursor === null && !chat?.theContact?.msgList?.length) { // 第一次加载默认没有动画
        scrollBottom(false);
        call && call(chat.theContact.msgList || []);
      }
      else {
        // 更新滚动位置
        const newSize = chat.scrollTopSize;
        // 距离顶部
        const msgRangeSize = newSize - oldSize;
        if (msgRangeSize > 0)
          chat.scrollTop(msgRangeSize);
      }
      isLoading.value = false;
    });
    pageInfo.value.isLast = data.isLast;
    pageInfo.value.cursor = data.cursor || undefined;
  }

  /**
   * 重新加载
   */
  function reload(roomId?: number) {
    roomId = roomId || chat.theRoomId;
    if (!chat.theContact || !roomId)
      return;
    //  TODO:判断缓存是否超过 10 分钟
    // 重置滚动位置
    chat.scrollTopSize = 0;
    pageInfo.value = {
      cursor: undefined as undefined | string,
      isLast: false,
      size: 20,
    };
    chat.theContact.msgList?.splice?.(0);
    isReload.value = true;
    isLoading.value = true;
    getChatMessagePage(roomId, 20, null, user.getToken).then(({ data }) => {
      if (roomId !== chat.theRoomId)
        return;
      // 追加数据
      if (!data?.list?.length || !chat.theContact)
        return;
      chat.theContact.msgList = data.list;
      pageInfo.value.isLast = data.isLast;
      pageInfo.value.cursor = data.cursor || undefined;
      isLoading.value = false;
      nextTick(() => scrollBottom(false));
      setTimeout(() => {
        isReload.value = false;
        scrollBottom(false);
        chat.saveScrollTop && chat.saveScrollTop();
      }, 100);
    }).catch(() => {
      isLoading.value = false;
      isReload.value = false;
      nextTick(() => scrollBottom(false));
    });
  }
  /**
   * 同步消息
   * 根据lastMsg比对进行同步
   */
  function syncMessages(roomId?: number) {
    roomId = roomId || chat.theRoomId;
    if (!roomId || !chat.contactMap[roomId])
      return;

    const contact = chat.contactMap[roomId];
    const lastMsgId = contact?.msgList?.[0]?.message.id;
    if (!contact || !contact.msgList || !lastMsgId) {
      return;
    }
    // 检查是否需要同步
    if (!contact.msgList.length || contact.lastMsgId !== lastMsgId) {
      reload(roomId);
    }
  }


  /**
   * 监听房间变化
   */
  function setupRoomWatcher() {
    watch(() => chat.theRoomId, async (val, oldVal) => {
      if (val) {
        // 消息阅读上报
        chat.setReadList(val);
        nextTick(() => {
          scrollbarRef.value && scrollBottom(false);
        });
        if (!chat.contactMap[val]?.msgList.length || chat.contactMap[val]?.lastMsgId !== chat.contactMap[val].lastMsgId) { // 会话判断是否同步
          reload(val);
        }
      }
      if (oldVal) { // 旧会话消息上报
        chat.setReadList(oldVal);
      }
    }, {
      immediate: true,
    });
  }

  /**
   * 滚动到指定消息
   * @Param msgId 消息id
   * @Param gapCount 偏移消息量（用于翻页）
   * @Param isAnimated 是否动画滚动
   */
  function scrollReplyMsg(msgId: number, gapCount: number = 0, isAnimated: boolean = true) {
    if (!msgId)
      return;
    const offset = -10;
    const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
    if (!el) {
      timer.value = setTimeout(() => {
        const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
        if (el) {
          timer.value && clearTimeout(timer.value);
          timer.value = null;
          scrollReplyMsg(msgId, gapCount); // 递归翻页
        }
        else {
          scrollTop(0);
          scrollReplyMsg(msgId, gapCount);
        }
      }, 120);
    }
    else {
      timer.value = null;
      // 找到对应消息
      nextTick(() => {
        if (!el)
          return;
        if (el.classList.contains("reply-shaing")) {
          return;
        }
        clearTimeout(timer.value);
        scrollTop((el?.offsetTop || 0) + offset, isAnimated);
        el.classList.add("reply-shaing");
        timer.value = setTimeout(() => {
          el.classList.remove("reply-shaing");
          timer.value = null;
        }, 2000);
      });
    }
  }

  /**
   * 滚动到底部
   */
  function scrollBottom(animate = true) {
    if (!scrollbarRef?.value?.wrapRef?.scrollHeight) {
      return;
    }
    scrollTop(scrollbarRef?.value?.wrapRef?.scrollHeight, animate);
  }

  /**
   * 保存上一个位置
   */
  function saveScrollTop() {
    chat.scrollTopSize = scrollbarRef?.value?.wrapRef?.scrollHeight || 0;
  }

  /**
   * 滚动到指定位置
   */
  async function scrollTop(size: number, animated = false) {
    if (chat.isMsgListScroll) {
      return;
    }
    chat.isMsgListScroll = true;
    scrollbarRef.value?.wrapRef?.scrollTo({ // 缓动
      top: size || 0,
      behavior: animated ? "smooth" : undefined,
    });
    if (animated) {
      await nextTick();
      setTimeout(() => {
        chat.isMsgListScroll = false;
      }, 300);
    }
    else {
      chat.isMsgListScroll = false;
    }
  }

  // 滚动
  const offset = computed(() => setting.isMobileSize ? -730 : -678);
  const debounceReadList = useDebounceFn((theRoomId: number) => {
    chat.setReadList(theRoomId);
  }, 500);

  /**
   * 滚动事件
   */
  function onScroll(e: { scrollTop: number; scrollLeft: number; }) {
    // 滚动到底部
    if (chat.theRoomId && e.scrollTop >= (scrollbarRef?.value?.wrapRef?.scrollHeight || 0) + offset.value) {
      chat.shouldAutoScroll = chat.theContact?.msgList?.[(chat.theContact.msgList?.length || 0) - 1]?.message?.type === MessageType.AI_CHAT_REPLY; // ai消息是否为会话最后一条
      chat.isScrollBottom = true;
      debounceReadList(chat.theRoomId);
    }
    else {
      chat.isScrollBottom = false;
      chat.shouldAutoScroll = false;
    }
  }

  /**
   * 设置事件监听
   */
  function setupEventListeners() {
    mitter.on(MittEventType.MSG_LIST_SCROLL, ({ type, payload }) => {
      switch (type) {
        case "scrollBottom":
          scrollBottom(payload?.animate);
          break;
        case "scrollReplyMsg":
          scrollReplyMsg(payload?.msgId, payload.gapCount, payload?.animate);
          break;
        case "saveScrollTop":
          saveScrollTop();
          break;
        case "scrollTop":
          scrollTop(payload?.size, payload?.animate);
          break;
      }
    });

    mitter.on(MittEventType.MESSAGE_QUEUE, (payload: MessageQueuePayload) => {
      if (payload.type === "success" || payload.type === "error") {
        // 消息发送成功或失败
      }
    });
  }

  /**
   * 清理事件监听
   */
  function cleanupEventListeners() {
    timer.value && clearTimeout(timer.value);
    timer.value = null;
    // 解绑事件
    mitter.off(MittEventType.MSG_LIST_SCROLL);
    mitter.off(MittEventType.MESSAGE_QUEUE);
  }

  /**
   * 初始化
   */
  function init() {
    setupRoomWatcher();
    setupEventListeners();

    // 组件卸载时清理
    onBeforeUnmount(() => {
      cleanupEventListeners();
    });
  }

  return {
    // 状态
    pageInfo,
    isLoading,
    isReload,
    scrollbarRef,
    timer,
    offset,

    // 方法
    loadData,
    reload,
    syncMessages,
    scrollReplyMsg,
    scrollBottom,
    saveScrollTop,
    scrollTop,
    onScroll,

    // 初始化
    init,
    setupEventListeners,
    cleanupEventListeners,
  };
}
