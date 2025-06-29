<script setup lang="ts">
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { appEnName, appKeywords, appName } from "@/constants/index";
import { useDefaultInit, useInit, useUnmounted } from "@/init/index";

// https://nuxt.com.cn/docs/guide/directory-structure/app
useHead({
  title: `${appEnName} | ${appName} 🍂`,
  meta: [
    {
      name: "description",
      content: "JiwuChat 🍂 : 轻量级跨平台IM聊天应用，集成AI机器人( DeepSeek/Gemini/Kimi... )、音视频通话及AI购物。支持多端消息同步，自定义主题，高效便捷 🍒",
    },
    {
      name: "keywords",
      content: appKeywords,
    },
  ],
  htmlAttrs: {
    lang: "zh",
  },
});

// 初始化
const route = useRoute();
const setting = useSettingStore();
const isIframe = ref(false);
const showShadowBorderRadius = computed(() => setting.isWeb && !setting.isMobileSize && !isIframe.value);
const isWindow10 = ref(false);

onMounted(() => {
  if (window) // 判断是否在iframe中
    isIframe.value = window?.self !== undefined && window?.self !== window?.top;
  if (route.path === "/msg" || route.path.startsWith("/extend") || (setting.isDesktop && route.path === "/login")) { // 进入消息页面
    useDefaultInit();
  }
  else {
    useInit();
  }
  checkWind10CloseShadow();
});

async function checkWind10CloseShadow() {
  const v = await useWindowsVersion();
  isWindow10.value = v === "Windows 10";
  if (isWindow10.value && setting.isDesktop) {
    getCurrentWebviewWindow()?.setShadow(false);
  }
}

onUnmounted(useUnmounted);
</script>

<template>
  <main class="h-100vh flex-row-c-c">
    <div
      class="h-full w-full overflow-hidden bg-color"
      :class="{
        'sm:(w-100vw mx-a h-full) md:(w-100vw mx-a h-full)  lg:(w-1360px mx-a h-92vh max-w-86vw max-h-1020px) shadow-lg': !isIframe && setting.isWeb,
        '!rounded-2 !wind-border-default': showShadowBorderRadius || $route.path === '/msg' || (setting.isDesktop && isWindow10 && $route.path !== '/msg'),
      }"
    >
      <NuxtLayout>
        <NuxtPage
          class="h-full w-full"
        />
      </NuxtLayout>
    </div>
  </main>
</template>

<style lang="scss">
</style>
