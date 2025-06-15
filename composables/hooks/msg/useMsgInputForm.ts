import ContextMenuGlobal from "@imengyu/vue3-context-menu";

export const MAX_UPLOAD_IMAGE_COUNT = 9;
// @unocss-include
/**
 * 消息输入框hook
 */
export function useMsgInputForm(
  inputRefName = "msgInputRef",
  handleSubmit: () => void,
  scrollbarRefs: {
    atScrollbarRef?: string;
    aiScrollbarRef?: string;
  } = {},
  popoverWidth = 160,
  focusRefName = "",
) {
  // store
  const setting = useSettingStore();
  const chat = useChatStore();

  const { atScrollbarRef = "atScrollbarRef", aiScrollbarRef = "aiScrollbarRef" } = scrollbarRefs;

  // 富文本编辑器相关
  const inputTextContent = ref("");
  const msgInputRef = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>(inputRefName);
  const focusRef = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>(focusRefName);
  const { focused: inputFocus } = useFocus(focusRef, { initialValue: false });
  const selectionRange = ref<Range | null>(null);

  // scrollbar refs
  const atScrollbar = useTemplateRef<any>(atScrollbarRef);
  const aiScrollbar = useTemplateRef<any>(aiScrollbarRef);

  // @和AI弹出框的显示控制
  const isAtUser = computed(() => chat.atUserList.length > 0);
  const isReplyAI = computed(() => chat.askAiRobotList.length > 0);
  const showAtOptions = ref(false);
  const showAiOptions = ref(false);
  const selectedAtItemIndex = ref(0);
  const selectedAiItemIndex = ref(0);
  const atFilterKeyword = ref("");
  const aiFilterKeyword = ref("");
  const optionsPosition = ref({
    left: 0,
    top: 0,
    width: 250,
  });

  // 性能优化：防抖处理
  const debouncedHandleInput = useDebounceFn(handleInput, 60);

  // 缓存DOM查询结果
  const domCache = new Map<string, Element[]>();
  const cacheTimeout = 5000; // 5秒后清理缓存

  // 清理缓存的定时器
  let cacheClearTimer: NodeJS.Timeout | null = null;

  watch(inputFocus, (val) => {
    if (!val) {
      nextTick(() => {
        showAtOptions.value = false;
        showAiOptions.value = false;
        clearDomCache(); // 失焦时清理缓存
      });
    }
  }, {
    immediate: true,
  });

  // 读取@用户列表 hook
  const { userOptions, userAtOptions, loadUser } = useLoadAtUserList();
  const { aiOptions, loadAi } = useLoadAiList();

  // AI选项显示控制
  const aiSelectOptions = computed(() => new Set(chat.askAiRobotList.map(p => p.userId)));
  const aiShowOptions = computed(() => {
    if (!aiOptions.value?.length)
      return [];
    return aiOptions.value?.filter(p => !aiSelectOptions.value.has(p.userId));
  });

  // 筛选后的候选项 - 添加缓存
  const filteredUserAtOptions = computed(() => {
    if (!atFilterKeyword.value) {
      return userAtOptions.value;
    }
    const keyword = sanitizeInput(atFilterKeyword.value.toLowerCase());
    return userAtOptions.value.filter(user =>
      user?.nickName?.toLowerCase().includes(keyword),
    );
  });

  const filteredAiOptions = computed(() => {
    if (!aiFilterKeyword.value) {
      return aiShowOptions.value;
    }
    const keyword = sanitizeInput(aiFilterKeyword.value.toLowerCase());
    return aiShowOptions.value.filter(ai =>
      ai?.nickName?.toLowerCase().includes(keyword),
    );
  });

  /**
   * 安全输入处理 - 防止XSS
   */
  function sanitizeInput(input: string): string {
    if (typeof input !== "string")
      return "";
    // 移除潜在的恶意字符
    return input.replace(/[<>'"&]/g, "").trim();
  }

  /**
   * 安全的DOM缓存管理
   */
  function getDomCache(key: string, selector: string): Element[] {
    if (!msgInputRef.value)
      return [];

    if (domCache.has(key)) {
      return domCache.get(key)!;
    }

    const elements = Array.from(msgInputRef.value.querySelectorAll(selector));
    domCache.set(key, elements);

    // 设置缓存清理定时器
    if (cacheClearTimer) {
      clearTimeout(cacheClearTimer);
    }
    cacheClearTimer = setTimeout(clearDomCache, cacheTimeout);

    return elements;
  }

  function clearDomCache() {
    domCache.clear();
    if (cacheClearTimer) {
      clearTimeout(cacheClearTimer);
      cacheClearTimer = null;
    }
  }

  /**
   * 更新选区范围 - 添加安全检查
   */
  function updateSelectionRange() {
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // 确保范围在我们的输入框内
        if (msgInputRef.value?.contains(range.commonAncestorContainer)) {
          selectionRange.value = range.cloneRange();
        }
      }
    }
    catch (error) {
      console.warn("Failed to update selection range:", error);
      selectionRange.value = null;
    }
  }

  /**
   * 优化的位置计算 - 使用RAF优化性能
   */
  function updateOptionsPosition() {
    if (!msgInputRef.value)
      return;

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0)
        return;

      const range = selection.getRangeAt(0);

      // 使用更安全的位置计算方法
      requestAnimationFrame(() => {
        const inputRect = msgInputRef.value!.getBoundingClientRect();
        const rangeRect = range.getBoundingClientRect();

        // 边界检查和计算
        let left = Math.max(0, rangeRect.left - inputRect.left);
        const maxLeft = Math.max(0, inputRect.width - popoverWidth);
        left = Math.min(left, maxLeft);

        optionsPosition.value = {
          left,
          top: Math.max(0, rangeRect.top - inputRect.top - 8),
          width: popoverWidth,
        };
      });
    }
    catch (error) {
      console.warn("Failed to update options position:", error);
    }
  }

  /**
   * 安全的文本提取
   */
  function getBeforeText(range: Range): string {
    try {
      const container = range.startContainer;
      const offset = range.startOffset;

      if (container.nodeType === Node.TEXT_NODE) {
        const textNode = container as Text;
        let beforeText = textNode.textContent?.substring(0, offset) || "";

        // 如果不是直接子节点，获取完整前置文本
        if (textNode.parentNode !== msgInputRef.value) {
          const walker = document.createTreeWalker(
            msgInputRef.value!,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                // 只接受安全的文本节点
                return msgInputRef.value!.contains(node)
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            },
          );

          let currentNode = walker.nextNode();
          let allText = "";
          while (currentNode) {
            if (currentNode === textNode) {
              allText += textNode.textContent?.substring(0, offset) || "";
              break;
            }
            else {
              allText += currentNode.textContent || "";
            }
            currentNode = walker.nextNode();
          }
          beforeText = allText;
        }
        return sanitizeInput(beforeText);
      }
      else if (container === msgInputRef.value) {
        return sanitizeInput(msgInputRef.value?.textContent || "");
      }
      return "";
    }
    catch (error) {
      console.warn("Failed to get before text:", error);
      return "";
    }
  }


  /**
   * 重置@和AI选择状态
   */
  function resetAtAndAiOptions() {
    showAtOptions.value = false;
    showAiOptions.value = false;
    atFilterKeyword.value = "";
    aiFilterKeyword.value = "";
  }

  /**
   * 检查输入类型并进行筛选 - 优化正则表达式
   */
  function checkInputType(beforeText: string): boolean {
    if (!beforeText || typeof beforeText !== "string")
      return false;

    // 使用更严格的正则表达式
    const atPattern = /@([\w\u4E00-\u9FA5]{0,20})$/;
    const aiPattern = /\/([\w\u4E00-\u9FA5]{0,20})$/;

    // 检查@用户输入
    const atMatch = beforeText.match(atPattern);
    if (atMatch && userAtOptions.value.length > 0 && !isReplyAI.value) {
      const keyword = sanitizeInput(atMatch[1] || "");
      atFilterKeyword.value = keyword;
      showAtOptions.value = true;
      showAiOptions.value = false;
      selectedAtItemIndex.value = 0;
      updateOptionsPosition();
      return true;
    }

    // 检查AI机器人输入
    const aiMatch = beforeText.match(aiPattern);
    if (aiMatch && aiOptions.value.length > 0 && !isAtUser.value) {
      const keyword = sanitizeInput(aiMatch[1] || "");
      aiFilterKeyword.value = keyword;
      showAiOptions.value = true;
      showAtOptions.value = false;
      selectedAiItemIndex.value = 0;
      updateOptionsPosition();
      return true;
    }

    return false;
  }

  /**
   * 优化的输入处理 - 添加防抖和错误处理
   */
  function handleInput() {
    try {
      updateFormContent();

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const beforeText = getBeforeText(range);

        if (beforeText && checkInputType(beforeText)) {
          updateSelectionRange();
          return;
        }
      }

      // 隐藏选择框
      showAtOptions.value = false;
      showAiOptions.value = false;
      atFilterKeyword.value = "";
      aiFilterKeyword.value = "";
      updateSelectionRange();
    }
    catch (error) {
      console.warn("Handle input error:", error);
      resetAtAndAiOptions();
    }
  }

  /**
   * 安全的标签插入 - 防止XSS
   */
  function createSafeElement(tagName: string, className: string, attributes: Record<string, string> = {}): HTMLElement {
    const element = document.createElement(tagName);
    element.className = className;
    element.contentEditable = "false";

    // 安全设置属性
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === "string" && value.length < 100) { // 限制属性值长度
        element.setAttribute(key, sanitizeInput(value));
      }
    });

    return element;
  }
  /**
   * 优化的标签插入逻辑
   */
  function insertTag(
    element: HTMLElement,
    tagData: { type: string, uid: string, username: string, text: string },
    matchRegex: RegExp,
    isSpace: boolean = false,
  ): boolean {
  // 参数验证
    if (!msgInputRef.value || !element || !tagData.uid) {
      console.warn("插入标签失败：缺少必要参数");
      return false;
    }

    try {
    // 检查是否已存在相同标签
      const existingTags = getDomCache(`${tagData.type}-tags`, `[data-uid="${tagData.uid}"]`);
      if (existingTags.length > 0) {
        console.log("标签已存在，跳过插入");
        return false;
      }

      // 获取当前选区
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        focusAtEnd();
        // 重新获取选区
        const newSelection = window.getSelection();
        if (!newSelection || newSelection.rangeCount === 0) {
          console.warn("无法获取有效选区");
          return false;
        }
      }

      const range = selection?.getRangeAt(0);
      if (!range) {
        return false;
      }
      const { startContainer, startOffset } = range;

      // 处理匹配文本删除
      let deletedMatchLength = 0;
      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = startContainer as Text;
        const beforeText = textNode.textContent?.substring(0, startOffset) || "";
        const match = beforeText.match(matchRegex);

        if (match && match[0].length > 0 && match[0].length <= 50) {
          const matchLength = match[0].length;
          const deleteStart = Math.max(0, startOffset - matchLength);

          // 删除匹配的文本
          textNode.deleteData(deleteStart, matchLength);

          // 更新 range 位置
          range.setStart(textNode, deleteStart);
          range.setEnd(textNode, deleteStart);

          deletedMatchLength = matchLength;
        }
      }

      // 插入标签元素
      range.deleteContents();
      range.insertNode(element);

      // 将光标定位到标签后面
      range.setStartAfter(element);
      range.collapse(true);

      // 更新选区
      selection?.removeAllRanges();
      selection?.addRange(range);

      // 清理和更新
      clearDomCache();
      updateFormContent();

      // 确保焦点在正确位置
      nextTick(() => {
        msgInputRef.value?.focus();

        // 确保光标在标签后面
        const newSelection = window.getSelection();
        if (newSelection && newSelection.rangeCount > 0) {
          const newRange = newSelection.getRangeAt(0);
          newRange.setStartAfter(element);
          newRange.collapse(true);
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
        }
      });

      return true;
    }
    catch (error) {
      console.error("插入标签失败:", error);
      return false;
    }
  }

  /**
   * 安全的@用户标签创建
   */
  function insertAtUserTag(user: any) {
    if (!user || !user.userId || !user.nickName)
      return;

    const outer = createSafeElement("span", "at-user-tag", {
      "data-type": "at-user",
      "data-uid": user.userId,
      "data-username": user.username || "",
      "title": `@${sanitizeInput(user.nickName)} (${sanitizeInput(user.username || "")})`,
    });

    const inner = createSafeElement("span", "at-user-inner");
    inner.textContent = `@${sanitizeInput(user.nickName)}`;
    outer.appendChild(inner);

    insertTag(outer, {
      type: "at-user",
      uid: user.userId,
      username: user.username || "",
      text: `@${user.nickName}`,
    }, /@[^@\s]*$/);
  }

  /**
   * 安全的AI机器人标签创建
   */
  function insertAiRobotTag(robot: AskAiRobotOption) {
    if (!robot || !robot.userId || !robot.nickName)
      return;

    // 添加到询问列表
    if (!chat.askAiRobotList.some(r => r.userId === robot.userId)) {
      chat.askAiRobotList.push(robot);
    }

    const outer = createSafeElement("span", "ai-robot-tag", {
      "data-type": "ai-robot",
      "data-uid": robot.userId,
      "data-username": robot.username || "",
      "title": `${sanitizeInput(robot.nickName)} (${sanitizeInput(robot.username || "")})`,
    });

    const inner = createSafeElement("span", "ai-robot-inner");
    inner.textContent = sanitizeInput(robot.nickName || "未知");
    outer.appendChild(inner);

    insertTag(outer, {
      type: "ai-robot",
      uid: robot.userId,
      username: robot.username || "",
      text: robot.nickName,
    }, /\/[^/\s]*$/);
  }

  /**
   * 安全的内容解析
   */
  function parseTagsFromDom<T>(parent: HTMLElement | null, selector: string, parseFunc: (tag: Element) => T | null): T[] {
    const dom = parent || msgInputRef.value;
    if (!dom)
      return [];

    try {
      const cacheKey = `${selector}-${Date.now()}`;
      const tags = getDomCache(cacheKey, selector);
      const results: T[] = [];

      tags.forEach((tag) => {
        try {
          const parsed = parseFunc(tag);
          if (parsed)
            results.push(parsed);
        }
        catch (error) {
          console.warn("Parse tag error:", error);
        }
      });

      return results;
    }
    catch (error) {
      console.warn("Parse tags from DOM error:", error);
      return [];
    }
  }

  /**
   * 清空输入框内容 - 安全版本
   */
  function clearInputContent() {
    if (msgInputRef.value) {
      // 安全清空，不直接操作innerHTML
      const range = document.createRange();
      range.selectNodeContents(msgInputRef.value);
      range.deleteContents();

      clearDomCache();
      updateFormContent();
    }
  }

  /**
   * 获取有效文本内容 - 添加安全检查
   */
  function getInputVaildText(): string {
    try {
      let content = msgInputRef.value?.textContent || "";
      inputTextContent.value = content;

      if (content && content.length < 10000) { // 限制内容长度
        // 过滤机器人
        chat.askAiRobotList.forEach((item) => {
          if (item.nickName) {
            content = content.replace(sanitizeInput(item.nickName), "");
          }
        });
      }

      return content.trim();
    }
    catch (error) {
      console.warn("Get input valid text error:", error);
      return "";
    }
  }

  // 处理键盘事件 - 原有逻辑保持不变但添加错误处理
  function handleKeyDown(e: KeyboardEvent) {
    try {
      updateSelectionRange();

      if ((showAtOptions.value || showAiOptions.value) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const options = showAtOptions.value ? filteredUserAtOptions.value : filteredAiOptions.value;
        const currentIndex = showAtOptions.value ? selectedAtItemIndex.value : selectedAiItemIndex.value;
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const newIndex = Math.max(0, Math.min(currentIndex + direction, options.length - 1));

        if (showAtOptions.value) {
          selectedAtItemIndex.value = newIndex;
          nextTick(() => {
            scrollToSelectedItem(true, newIndex);
          });
        }
        else if (showAiOptions.value) {
          selectedAiItemIndex.value = newIndex;
          nextTick(() => {
            scrollToSelectedItem(false, newIndex);
          });
        }
        return;
      }

      // 上下键切换会话
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && setting.downUpChangeContact && !getInputVaildText()) {
        e.preventDefault();
        chat.onDownUpChangeRoom(e.key === "ArrowDown" ? "down" : "up");
      }

      // 处理选择@用户或AI
      if ((showAtOptions.value || showAiOptions.value) && (e.key === "Enter" || e.key === "Tab")) {
        e.preventDefault();
        if (showAtOptions.value) {
          const selectedUser = filteredUserAtOptions.value[selectedAtItemIndex.value];
          if (selectedUser) {
            handleSelectAtUser(selectedUser);
          }
        }
        else if (showAiOptions.value) {
          const selectedAi = filteredAiOptions.value[selectedAiItemIndex.value];
          if (selectedAi) {
            handleSelectAiRobot(selectedAi);
          }
        }
        return;
      }

      // 处理ESC键退出选择框
      if ((showAtOptions.value || showAiOptions.value) && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        // 重置@和AI选择状态
        resetAtAndAiOptions();
        return;
      }

      // 处理发送消息
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
    catch (error) {
      console.warn("Handle key down error:", error);
    }
  }
  // 组件卸载时清理资源
  onUnmounted(() => {
    clearDomCache();
    clearImages(); // 清理图片并释放 blob URLs
    if (cacheClearTimer) {
      clearTimeout(cacheClearTimer);
    }
  });

  /**
   * 更新表单内容
   */
  function updateFormContent() {
    if (!msgInputRef.value)
      return;

    // 解析AT用户
    resolveContentAtUsers(msgInputRef.value);
    // 解析AI
    resolveContentAiAsk(msgInputRef.value);
  }


  // 解析@用户
  function resolveContentAtUsers(parent: HTMLElement | null) {
    const atUsers = parseTagsFromDom(parent, ".at-user-tag", (tag) => {
      const uid = tag.getAttribute("data-uid");
      const username = tag.getAttribute("data-username");
      const nickName = tag.textContent?.replace(/^@/, "");

      if (!uid || !username || !nickName)
        return null;

      // 从userOptions中找到完整的用户信息
      const userInfo = userOptions.value.find(u => u.userId === uid);

      return {
        label: userInfo?.label || nickName,
        value: userInfo?.value || nickName,
        userId: uid,
        username,
        nickName,
        avatar: userInfo?.avatar,
      } as AtChatMemberOption;
    });

    chat.atUserList = atUsers;
    return atUsers;
  }

  /**
   * 处理选择@用户
   */
  function handleSelectAtUser(user: AskAiRobotOption) {
    // 重置@和AI选择状态
    resetAtAndAiOptions();

    // 先确保输入框有焦点和正确的选区
    if (!msgInputRef.value)
      return;

    // 恢复之前保存的选区范围，或者聚焦到末尾
    if (selectionRange.value) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectionRange.value);
    }
    else {
      focusAtEnd();
    }

    // 使用DOM插入@用户标签
    insertAtUserTag(user);
  }

  /**
   * 处理选择AI机器人
   */
  function handleSelectAiRobot(robot: AskAiRobotOption) {
    // 重置@和AI选择状态
    resetAtAndAiOptions();

    // 先确保输入框有焦点和正确的选区
    if (!msgInputRef.value)
      return;

    // 恢复之前保存的选区范围，或者聚焦到末尾
    if (selectionRange.value) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectionRange.value);
    }
    else {
      focusAtEnd();
    }

    // 使用DOM插入AI机器人标签
    insertAiRobotTag(robot);
  }

  /**
   * 聚焦到输入框末尾
   */
  function focusAtEnd() {
    if (!msgInputRef.value)
      return;

    msgInputRef.value.focus();
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(msgInputRef.value);
    range.collapse(false); // 折叠到末尾

    selection?.removeAllRanges();
    selection?.addRange(range);

    updateSelectionRange();
  }

  // 解析AI
  function resolveContentAiAsk(parent: HTMLElement | null) {
    const aiRobots = parseTagsFromDom(parent, ".ai-robot-tag", (tag) => {
      const uid = tag.getAttribute("data-uid");
      const username = tag.getAttribute("data-username");
      const nickName = tag.textContent;

      if (!uid || !username || !nickName)
        return null;

      // 从aiOptions中找到完整的机器人信息
      const robotInfo = aiOptions.value.find(r => r.userId === uid);

      return {
        label: robotInfo?.label || nickName,
        value: robotInfo?.value || nickName,
        userId: uid,
        username,
        nickName,
        avatar: robotInfo?.avatar,
        aiRobotInfo: robotInfo?.aiRobotInfo,
      } as AskAiRobotOption;
    });

    chat.askAiRobotList = aiRobots;
    return aiRobots;
  }
  /**
   * 插入图片到编辑器 - 重构版本，确保光标在输入框内
   */
  function insertImage(file: File | string, alt: string = "") {
    if (!msgInputRef.value) {
      console.warn("msgInputRef 不存在");
      return;
    }

    // TODO: 非ai机器人输入框
    if (chat.isAIRoom || isReplyAI.value) {
      ElMessage.error("AI对话暂不支持图片输入！");
      return;
    }

    // 限制最多图片数量
    if (getImageCounts() >= MAX_UPLOAD_IMAGE_COUNT) {
      ElMessage.error(`最多只能添加 ${MAX_UPLOAD_IMAGE_COUNT} 张图片！`);
      return;
    }

    try {
      // 确保输入框获得焦点
      msgInputRef.value.focus();

      // 等待下一个tick确保焦点生效
      nextTick(() => {
        try {
          const selection = window.getSelection();
          let range: Range;

          // 检查是否有有效的选区，且选区在输入框内
          if (selection && selection.rangeCount > 0) {
            const currentRange = selection.getRangeAt(0);

            // 验证选区是否在输入框内
            const isInInputBox = msgInputRef.value!.contains(currentRange.commonAncestorContainer)
              || msgInputRef.value === currentRange.commonAncestorContainer;

            if (isInInputBox) {
              range = currentRange;
            }
            else {
              // 选区不在输入框内，创建新的选区到末尾
              range = createRangeAtEnd();
            }
          }
          else {
            // 没有选区，创建新的选区到末尾
            range = createRangeAtEnd();
          }

          // 插入图片
          insertImageAtRange(file, alt, range);
        }
        catch (error) {
          console.warn("插入图片时发生错误:", error);
          // 发生错误时，尝试在末尾插入
          try {
            const fallbackRange = createRangeAtEnd();
            insertImageAtRange(file, alt, fallbackRange);
          }
          catch (fallbackError) {
            console.error("插入图片失败:", fallbackError);
            ElMessage.error("插入图片失败，请重试");
          }
        }
      });
    }
    catch (error) {
      console.warn("Insert image error:", error);
      ElMessage.error("插入图片失败，请重试");
    }
  }

  /**
   * 创建指向输入框末尾的选区
   */
  function createRangeAtEnd(): Range {
    const range = document.createRange();
    range.selectNodeContents(msgInputRef.value!);
    range.collapse(false); // 折叠到末尾

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    return range;
  }

  /**
   * 在指定范围插入图片
   */
  interface ImageContainer extends HTMLSpanElement {
    __imageFile?: File;
    __objectUrl?: string;
  }

  function insertImageAtRange(file: File | string, alt: string, range: Range): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
      // 创建图片容器
        const imageContainer = createSafeElement("span", "image-container", {
          "data-type": "image",
          "contenteditable": "false",
          "role": "img",
          "tabindex": "0",
        }) as ImageContainer;

        // 创建图片元素
        const img = document.createElement("img");
        img.className = "inserted-image";
        img.style.cssText = "max-width: 12rem; max-height: 9rem; border-radius: 0.3rem; cursor: pointer;";
        img.draggable = false;
        img.setAttribute("role", "img");
        img.setAttribute("tabindex", "0");

        let objectUrl: string | null = null;

        // 错误处理
        img.onerror = () => {
          console.error("图片加载失败");
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          reject(new Error("图片加载失败"));
        };

        // 成功加载处理
        img.onload = () => {
        // 图片加载完成后释放临时URL
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
          resolve();
        };

        if (typeof file === "string") {
        // URL字符串
          img.src = file;
          img.alt = alt || "图片";
        }
        else {
        // File对象
          if (!file.type.startsWith("image/")) {
            reject(new Error("文件类型不支持"));
            return;
          }

          objectUrl = URL.createObjectURL(file);
          img.src = objectUrl;
          img.alt = alt || file.name || "图片";

          // 存储文件信息
          imageContainer.__imageFile = file;
          imageContainer.__objectUrl = objectUrl;
        }

        // 创建删除按钮
        const deleteBtn = createSafeElement("span", "image-delete-btn", {
          "title": "删除图片",
          "role": "button",
          "tabindex": "0",
          "aria-label": "删除图片",
        });

        // 统一的事件处理
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          const target = e.target as HTMLElement;

          if (target.classList.contains("image-delete-btn")) {
          // 删除图片
            const storedUrl = imageContainer.__objectUrl;
            if (storedUrl) {
              URL.revokeObjectURL(storedUrl);
            }

            imageContainer.remove();
            updateFormContent();
          }
          else if (target.tagName === "IMG") {
          // 预览图片
            useImageViewer.open({
              urlList: [img.src],
              initialIndex: 0,
            });
          }
        };

        // 键盘事件处理
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick(e);
          }
        };

        // 绑定事件
        imageContainer.addEventListener("click", handleClick);
        imageContainer.addEventListener("keydown", handleKeyDown);

        // 组装元素
        imageContainer.appendChild(img);
        imageContainer.appendChild(deleteBtn);

        requestAnimationFrame(() => {
          try {
            const selection = window.getSelection();
            // 在范围内插入图片
            range.deleteContents();
            range.insertNode(imageContainer);

            // 光标定位到图片后面（紧贴）
            range.setStartAfter(imageContainer);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);

            // 确保输入框保持焦点
            msgInputRef?.value?.focus();

            // 更新表单内容
            updateFormContent();
          }
          catch (error) {
            console.error("DOM操作失败:", error);
            reject(error);
          }
        });
      }
      catch (error) {
        console.error("插入图片失败:", error);
        reject(error);
      }
    });
  }


  function getImageCounts() {
    if (!msgInputRef.value)
      return 0;

    const imageContainers = msgInputRef.value.querySelectorAll(".image-container");
    return imageContainers.length;
  }
  /**
   * 获取编辑器中的图片文件
   */
  function getImageFiles(): File[] {
    if (!msgInputRef.value)
      return [];

    const imageContainers = msgInputRef.value.querySelectorAll(".image-container");
    const files: File[] = [];

    imageContainers.forEach((container) => {
      const file = (container as any).__imageFile;
      if (file instanceof File) {
        files.push(file);
      }
    });

    return files;
  }

  /**
   * 清理图片预览
   */
  function clearImages() {
    if (!msgInputRef.value)
      return;

    const imageContainers = msgInputRef.value.querySelectorAll(".image-container");
    imageContainers.forEach((container) => {
      // 释放 blob URL，避免内存泄漏
      const objectUrl = (container as any).__objectUrl;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      container.remove();
    });
    updateFormContent();
  }

  // 通用剪贴板操作
  const clipboardActions = {
    async cut() {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        try {
          await navigator.clipboard.writeText(selection.toString());
          selection.deleteFromDocument();
          updateFormContent();
        }
        catch (err) {
          document.execCommand("cut");
          updateFormContent();
        }
      }
    },

    async copy() {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        try {
          await navigator.clipboard.writeText(selection.toString());
        }
        catch (err) {
          document.execCommand("copy");
        }
      }
    },

    async paste() {
      try {
        // 先尝试从剪贴板读取数据
        const clipboardData = await navigator.clipboard.read();

        for (const item of clipboardData) {
          if (item.types.some(type => type.startsWith("image/"))) {
            const imageType = item.types.find(type => type.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const file = new File([blob], `pasted-image-${Date.now()}.${imageType.split("/")[1]}`, { type: imageType });
              insertImage(file);
              return;
            }
          }
        }

        // 如果没有图片，处理文本
        const text = await navigator.clipboard.readText();
        if (text) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            updateFormContent();
          }
        }
      }
      catch (err) {
        // 降级处理
        try {
          const text = await navigator.clipboard.readText();
          document.execCommand("insertText", false, text);
          updateFormContent();
        }
        catch (e) {
          console.warn("Paste failed:", e);
        }
      }
    },

    selectAll() {
      const selection = window.getSelection();
      const range = document.createRange();
      if (msgInputRef.value) {
        range.selectNodeContents(msgInputRef.value);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    },
  };
  // 右键菜单
  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    const selectedText = window.getSelection()?.toString();

    const contextMenuItems = [
      {
        label: "剪切",
        customClass: "group",
        icon: "hover:scale-106 transition-200 i-solar:scissors-line-duotone",
        hidden: !selectedText,
        onClick: clipboardActions.cut,
      },
      {
        label: "复制",
        customClass: "group",
        icon: "hover:scale-106 transition-200 i-solar:copy-line-duotone",
        hidden: !selectedText,
        onClick: clipboardActions.copy,
      },
      {
        label: "粘贴",
        customClass: "group",
        icon: "hover:scale-106 transition-200 i-solar:document-text-outline",
        onClick: clipboardActions.paste,
      },
      {
        label: "全选",
        icon: "i-solar:check-read-outline",
        onClick: clipboardActions.selectAll,
      },
    ];

    ContextMenuGlobal.showContextMenu({
      x: e.x,
      y: e.y,
      theme: setting.contextMenuTheme,
      items: contextMenuItems,
    });
  }
  /**
   * 滚动到选中项
   * @param isAtOptions 是否为@用户列表
   * @param selectedIndex 选中项索引
   */
  function scrollToSelectedItem(isAtOptions: boolean, selectedIndex: number) {
    if (isAtOptions && atScrollbar.value) {
      // 调用@用户列表的滚动方法
      atScrollbar.value.scrollToItem?.(selectedIndex);
    }
    else if (!isAtOptions && aiScrollbar.value) {
      // 调用AI机器人列表的滚动方法
      aiScrollbar.value.scrollToItem?.(selectedIndex);
    }
  }

  return {
    inputFocus,
    msgInputRef,
    focusRef,
    selectionRange,
    inputTextContent,
    // @和AI选择相关
    showAtOptions,
    showAiOptions,
    selectedAtItemIndex,
    selectedAiItemIndex,
    atFilterKeyword,
    aiFilterKeyword,
    optionsPosition,
    filteredUserAtOptions,
    filteredAiOptions,
    aiShowOptions,
    isReplyAI,
    userOptions,
    userAtOptions,
    aiOptions,

    // scrollbar refs
    atScrollbar,
    aiScrollbar, // 方法
    loadUser,
    loadAi,
    updateSelectionRange,
    clearInputContent,
    focusAtEnd,
    updateFormContent,
    insertAiRobotTag,
    insertAtUserTag,
    insertImage,
    getImageCounts,
    getImageFiles,
    clearImages,
    updateOptionsPosition,
    scrollToSelectedItem,
    resolveContentAtUsers,
    checkInputType,
    handleSelectAtUser,
    handleSelectAiRobot,
    handleInput: debouncedHandleInput,
    handleKeyDown,
    resetAtAndAiOptions,
    onContextMenu,
    getInputVaildText,
  };
}
