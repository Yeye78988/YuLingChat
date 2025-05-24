import type { ElScrollbar } from "element-plus";
import type { PageInfo } from "~/composables/store/useChatStore";

const PAGINATION_SIZE = 20;
const HIGHLIGHT_DURATION = 2000;
const SCROLL_OFFSET = -10;
const SCROLL_DEBOUNCE_TIME = 300;
const REPLY_SEARCH_INTERVAL = 120;

/**
 * 消息列表 Hook
 * 提供消息列表相关的功能
 */
export function useMessageList(scrollbarRefName = "scrollbarRef") {
  const chat = useChatStore();
  const user = useUserStore();
  const setting = useSettingStore();

  // 响应式状态
  const pageInfo = computed(() => chat?.theContact?.pageInfo);
  const isLoading = computed(() => !!chat?.theContact?.isLoading);
  const isReload = computed(() => !!chat?.theContact?.isReload);
  const offset = computed(() => setting.isMobileSize ? -730 : -678);

  // 将msgMap和msgIds转换为有序的消息数组，供组件使用
  const msgList = computed(() => chat.getMessageList(chat.theRoomId));

  // 滚动相关
  type ScrollbarRefType = InstanceType<typeof ElScrollbar>;
  const scrollbarRef = useTemplateRef<ScrollbarRefType>(scrollbarRefName);
  const timer = ref<number | null>(null);

  // 防抖函数 - 消息已读上报
  const debounceReadList = useDebounceFn((theRoomId: number) => {
    chat.setReadList(theRoomId);
  }, 500);

  /**
   * 取消计时器
   */
  const clearTimer = () => {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
  };

  /**
   * 检查房间ID是否有效
   */
  const isValidRoom = (roomId?: number): roomId is number => {
    return !!roomId && !!chat?.contactMap?.[roomId];
  };

  /**
   * 加载数据
   */
  async function loadData(roomId?: number, call?: (data?: ChatMessageVO[]) => void) {
    roomId = roomId || chat.theRoomId;
    if (!isValidRoom(roomId))
      return;

    const theContact = chat?.contactMap?.[roomId];
    if (!theContact)
      return;
    const thePageInfo = chat.contactMap[roomId]!.pageInfo as PageInfo;
    // 检查是否应该加载数据
    if (theContact.isLoading || theContact.isReload || theContact.isSyncing || thePageInfo.isLast) {
      return;
    }
    if (!theContact.pageInfo) {
      theContact.pageInfo = {
        cursor: undefined as undefined | string,
        isLast: false,
        size: PAGINATION_SIZE,
      };
    }
    // 设置加载状态
    theContact.isLoading = true;

    try {
      const { data, code } = await getChatMessagePage(roomId, thePageInfo.size || PAGINATION_SIZE, thePageInfo.cursor, user.getToken);
      if (code !== StatusCode.SUCCESS) {
        console.warn("加载消息失败");
        return;
      }

      // 处理新消息
      if (data?.list?.length) {
        // 将新消息添加到msgMap中
        const newMsgIds: number[] = [];
        data.list.forEach((msg) => {
          const msgId = msg.message.id;
          if (!theContact.msgMap[msgId]) {
            newMsgIds.push(msgId);
          }
          theContact.msgMap[msgId] = msg;
        });
        theContact.msgIds.unshift(...newMsgIds);
      }

      const oldSize = theContact.scrollTopSize || 0;
      // 更新页面信息
      thePageInfo.isLast = data.isLast;
      thePageInfo.cursor = data.cursor || undefined;

      await nextTick();
      chat.saveScrollTop && chat.saveScrollTop();
      call && call(msgList.value);
      if (thePageInfo.cursor === null && !theContact.msgIds?.length) {
        // 第一次加载默认没有动画
        scrollBottom(false);
      }
      else {
        // 计算并更新滚动位置
        const newSize = theContact.scrollTopSize || 0;
        const msgRangeSize = newSize - oldSize;
        if (msgRangeSize > 0) {
          scrollTop(msgRangeSize);
        }
      }
      // 重置加载状态
      theContact.isLoading = false;
    }
    catch (error) {
      console.error("加载消息出错:", error);
      if (theContact) {
        theContact.isLoading = false;
        if (thePageInfo) {
          thePageInfo.isLast = false;
          thePageInfo.cursor = undefined;
        }
      }
    }
  }

  /**
   * 重新加载消息
   */
  async function reload(roomId?: number) {
    roomId = roomId || chat.theRoomId;
    if (!isValidRoom(roomId))
      return;

    const contactData = chat.contactMap[roomId];
    if (!contactData)
      return;
    if (contactData.isLoading || contactData.isReload)
      return;
    // 重置滚动位置和页面信息
    contactData.scrollTopSize = 0;
    contactData.pageInfo = {
      cursor: undefined as undefined | string,
      isLast: false,
      size: PAGINATION_SIZE,
    };
    const thePageInfo = chat.contactMap[roomId]!.pageInfo as PageInfo;
    // 清空现有消息
    // chat.contactMap[roomId]!.msgMap = {};
    // chat.contactMap[roomId]!.msgIds = [];
    chat.contactMap[roomId]!.isReload = true;
    chat.contactMap[roomId]!.isLoading = true;

    try {
      const { data } = await getChatMessagePage(roomId, PAGINATION_SIZE, null, user.getToken);

      // 添加新消息
      if (data?.list?.length) {
        const ids: number[] = [];
        for (const msg of data.list) {
          if (!chat.contactMap[roomId]!.msgMap[msg.message.id]) {
            ids.push(msg.message.id);
          }
          chat.contactMap[roomId]!.msgMap[msg.message.id] = msg;
        }
        chat.contactMap[roomId]!.msgIds = ids;
        if (thePageInfo) {
          thePageInfo.isLast = data.isLast;
          thePageInfo.cursor = data.cursor || undefined;
        }
      }
      if (chat.theRoomId === roomId) {
        // 滚动到底部
        await nextTick();
        scrollBottom(false);
        chat.saveScrollTop && chat.saveScrollTop();
      }
      chat.contactMap[roomId]!.isLoading = false;
      chat.contactMap[roomId]!.isReload = false;
    }
    catch (error) {
      console.error("重新加载消息出错:", error);
      await nextTick();
      scrollBottom(false);
      chat.saveScrollTop && chat.saveScrollTop();
      chat.contactMap[roomId]!.isLoading = false;
      chat.contactMap[roomId]!.isReload = false;
    }
  }


  /**
   * 同步消息
   * 根据lastMsg比对进行同步
   */
  async function syncMessages(roomId?: number) {
    roomId = roomId || chat.theRoomId;
    if (!isValidRoom(roomId))
      return;

    if (!chat.contactMap[roomId] || chat.contactMap[roomId]!.isSyncing)
      return;

    try {
      chat.contactMap[roomId]!.isSyncing = true;
      // 获取第一条消息ID（如果存在）
      const firstMsgId = chat.contactMap[roomId]!.msgIds?.[0];
      const firstMsg = firstMsgId ? chat.contactMap[roomId]!.msgMap[firstMsgId] : undefined;
      const firstMsgIdValue = firstMsg?.message.id;

      if (!chat.contactMap[roomId]!.msgIds?.length || !firstMsgIdValue)
        return;

      // 检查是否需要同步
      if (!chat.contactMap[roomId]!.msgIds.length || chat.contactMap[roomId]!.lastMsgId !== firstMsgIdValue) {
        await reload(roomId);
      }
    }
    finally {
      if (chat.contactMap[roomId]!) {
        chat.contactMap[roomId]!.isSyncing = false;
      }
    }
  }

  /**
   * 监听房间变化
   */
  function setupRoomWatcher() {
    watch(() => chat.theRoomId, async (val, oldVal) => {
      // 处理新房间
      if (val) {
        // 消息阅读上报
        chat.setReadList(val);
        // 滚动到底部
        nextTick(() => {
          if (scrollbarRef.value)
            scrollBottom(false);
        });

        // 检查是否需要同步消息
        const contact = chat?.contactMap?.[val];
        if (contact && (!contact.msgIds.length || contact.lastMsgId !== contact?.lastMsgId))
          reload(val);
      }

      // 处理旧房间
      if (oldVal) {
        chat.setReadList(oldVal);
      }
    }, {
      immediate: true,
    });
  }

  /**
   * 滚动到指定消息
   */
  function scrollReplyMsg(msgId: number, gapCount: number = 0, isAnimated: boolean = true) {
    if (!msgId)
      return;

    clearTimer();

    const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;

    if (!el) {
      // 没找到元素，设置定时器尝试再次查找
      timer.value = window.setTimeout(() => {
        const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
        if (el) {
          clearTimer();
          scrollReplyMsg(msgId, gapCount);
        }
        else {
          scrollTop(0);
          scrollReplyMsg(msgId, gapCount);
        }
      }, REPLY_SEARCH_INTERVAL);
    }
    else {
      // 找到对应消息，滚动到该位置
      nextTick(() => {
        if (!el)
          return;
        if (el.classList.contains("reply-shaing"))
          return;

        clearTimer();
        scrollTop((el.offsetTop || 0) + SCROLL_OFFSET, isAnimated);

        // 高亮显示
        el.classList.add("reply-shaing");
        timer.value = window.setTimeout(() => {
          el.classList.remove("reply-shaing");
          clearTimer();
        }, HIGHLIGHT_DURATION);
      });
    }
  }

  /**
   * 滚动到底部
   */
  function scrollBottom(animate = true) {
    scrollTop(scrollbarRef?.value?.wrapRef?.scrollHeight || 0, animate);
  }

  /**
   * 保存上一个位置
   */
  function saveScrollTop() {
    if (chat.theRoomId && chat.theContact) {
      chat.theContact.scrollTopSize = scrollbarRef?.value?.wrapRef?.scrollHeight || 0;
    }
  }

  /**
   * 滚动到指定位置
   */
  function scrollTop(size: number, animated = false) {
    // 执行滚动
    scrollbarRef.value?.wrapRef?.scrollTo({
      top: size,
      behavior: animated ? "smooth" : undefined,
    });
  }

  /**
   * 滚动事件处理
   */
  function onScroll(e: { scrollTop: number; scrollLeft: number; }) {
    if (!chat.theRoomId)
      return;

    // 计算是否到达底部
    const isAtBottom = e.scrollTop >= (scrollbarRef?.value?.wrapRef?.scrollHeight || 0) + offset.value;

    if (isAtBottom) {
      // 更新状态并触发已读上报
      const lastMsg = msgList.value[msgList.value.length - 1];
      const isLastMessageFromAI = lastMsg?.message?.type === MessageType.AI_CHAT_REPLY;
      chat.shouldAutoScroll = isLastMessageFromAI;
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
  }

  /**
   * 清理事件监听和计时器
   */
  function cleanupEventListeners() {
    clearTimer();
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
    msgList,
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
