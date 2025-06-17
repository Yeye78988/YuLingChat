<div align=center>
 <div align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./jiwuchat-tauri.png" width="140px" height="140px" alt="이미지 이름" align=center />
 </div>
 <h2 align=center style="margin: 2em 0;">JiwuChat Tauri APP</h2>

<div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri" target="_blank">
        <img class="disabled-img-view" src="https://img.shields.io/badge/Github-프로젝트-blueviolet.svg?style=plasticr" alt="프로젝트" >
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/stargazers" target="_blank">
        <img class="disabled-img-view" alt="License"
          src="https://img.shields.io/github/stars/Kiwi233333/jiwu-mall-chat-tauri.svg?style=social">
      </a>
    </div>
    <div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/commits" target="_blank">
        <img class="disabled-img-view" alt="Commit"
          src="https://img.shields.io/github/commit-activity/m/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/issues" target="_blank">
        <img class="disabled-img-view" alt="Issues" src="https://img.shields.io/github/issues/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
    </div>
    <div>
      <a href="`https://github.com/Kiwi233333/jiwu-mall-chat-tauri/blob/main/LICENSE`" target="_blank">
          <img class="disabled-img-view" alt="License"
          src="https://img.shields.io/github/license/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
      <a href="https://app.netlify.com/sites/jiwuchat/deploys" target="_blank">
          <img src="https://api.netlify.com/api/v1/badges/b68ad9ac-53e5-4c5a-ac56-a8882ffe7697/deploy-status" alt="+QQ 그룹"/>
      </a>
      <a href="https://qm.qq.com/q/iSaETNVdKw" target="_blank">
        <img src="https://img.shields.io/badge/QQ 그룹:939204073 -blue?logo=tencentqq&logoColor=white" alt="QQ 그룹"/>
      </a>
    </div>
    <div>
      <a href="https://www.deepseek.com/" target="_blank" style="margin: 2px;">
        <img alt="DeepSeek AI" src="https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/badge.svg?raw=true" />
      </a>
    </div>

공식 웹사이트: [JiwuChat](https://blog.jiwuchat.top/)
<br>
언어 : [简体中文](../README.md) | [English](./README.en.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [日本語](./README.ja.md) | **한국어** | [Português](./README.pt.md) | [Русский](./README.ru.md)

</div>

## 소개

JiwuChat은 Tauri2와 Nuxt3로 구축된 경량 `(~8MB)` 다중 플랫폼 채팅 애플리케이션입니다. 다양한 실시간 메시징 기능, AI 그룹 채팅 봇(`iFlytek Spark`, `KimiAI` 등 통합), `WebRTC 음성/영상 통화`, 화면 공유, AI 기반 쇼핑을 지원합니다. 텍스트, 이미지, 파일, 음성 메시지를 지원하는 장치 간 원활한 통신과 그룹 채팅 및 사용자 정의 설정을 가능하게 합니다. 효율적인 소셜 네트워킹을 위한 라이트/다크 모드가 제공됩니다. ✨

## 하나의 코드, 여러 플랫폼

![다중 플랫폼 지원](./previews.png)

## 기본 계정

- 사용자명: ikun233
- 비밀번호: 123456
- 데모: [웹 버전](https://jiwuchat.top/)

> ⚠ 참고: ~~이 테스트 계정은 제한된 권한을 가지고 있습니다(파일 업로드, 프로필 편집, 비밀번호 변경 등 불가).~~

> 👀 지원해 주셔서 감사합니다! 프로젝트는 아직 개발 중이며 백엔드는 아직 오픈소스가 아닙니다. 이메일이나 QQ로 피드백을 자유롭게 공유해 주세요.

## 기능 목록

| 모듈           | 설명                                                                       | 상태  |
|----------------|---------------------------------------------------------------------------|-------|
| 사용자 모듈    | 계정, 전화, 이메일을 통한 로그인/회원가입; 프로필 관리 지원                 | ✔     |
| 메시징         | 텍스트, 이미지, 파일, 음성, @멘션, 취소, 삭제, AI 답변 지원                | ✔     |
| 채팅 세션      | 그룹 채팅, 개인 채팅, 고정, 역할(소유자, 관리자 등)                        | ✔     |
| 연락처         | 연락처 보기, 추가, 삭제                                                   | ✔     |
| 시스템 업데이트 | 자동 업데이트, 버전 공지                                                   | ✔     |
| 계정 보안      | 로그인, 비밀번호 변경, 장치 보안, 온라인 상태 관리                         | ✔     |
| AI 모듈        | 다중 AI 채팅봇(`DeepSeek`, `iFlytek Spark`, `KimiAI` 등) 지원            | ✔     |
| 스마트 쇼핑    | `Jiwu Circle`을 통한 AI 기반 제품 추천                                    | ✔     |
| 파일 관리      | 로컬 파일 다운로드, 열기, 삭제                                            | ✔     |
| 음성/비디오    | `WebRTC` 기반 화면 공유, 음성, 비디오 통화                                | ✔     |
| 기타           | AI 번역, 다크/라이트 모드, 폰트, 사용자 정의 다운로드 경로, 다중 OS 지원    | ✔     |

## 스크린샷

- 데스크톱 앱: 로그인 / 회원가입

![로그인](./login.png)

![회원가입](./register.png)

- 라이트 / 다크 테마

![라이트](./chat1.png)

![홈](./chat.png)

- AI 채팅봇 (DeepSeek, iFlytek Spark, Kimi AI) 🤩

![AI 채팅봇](./group-ai-ds.png)

![AI 채팅봇](./group-ai-2.png)

![AI 채팅봇](./group-ai-1.png)

- 음성/비디오 통화 (WebRTC)

![음성/비디오](./rtc1.png)

- 화면 공유

![화면 공유](./rtc3.png)

- 소셜 채팅

![다크](./chat2.png)

- AI 쇼핑 ([Jiwu Circle](https://github.com/KiWi233333/jiwu-mall-sites) 제공)

![다크](./chat3.png)

![다크](./chat3.2.png)

- 계정 & 보안

![계정](./chat4.png)

![보안](./chat5.png)

- 설정

![설정](./chat6-light.png)

- 모바일 적응

<div>
 <img src="./chat12.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat14.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat13.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat7.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./rtc2.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./rtc_remove_desktop.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat8.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat10.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat15.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat11.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat17.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat16.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
 <img src="./chat9.png" width = "190" style="display:inline-block;" alt="모바일" align=center />
</div>

## ⏳ 시작하기

### 📦 종속성 설치

```sh
Node.js >= 18 필요
npm install -g pnpm

pnpm install
```

### ✨ 개발

- 📌 백엔드 서버가 **없는** 경우, `.env.development`를 수정하거나 `.env.production`을 사용하세요.

```sh
터미널 1: Nuxt 시작 (프로덕션)
pnpm run prod:nuxt
터미널 2: Tauri 시작
pnpm run dev:tauri
```

- 백엔드가 **있는** 경우, 개발을 위해 `.env.development`를 사용자 정의하세요:

```sh
별도 실행 권장
터미널 1: Nuxt 시작
pnpm run dev:nuxt
터미널 2: Tauri 시작
pnpm run dev:tauri
```

### 📦 빌드

```sh
pnpm run build:tauri
```

### ❌ pnpm 설치 오류

레지스트리 확인:

```sh
pnpm get registry
```

임시 수정:

```sh
pnpm --registry https://registry.npm.taobao.org install any-touch
```

영구 변경:

```sh
pnpm config set registry https://registry.npm.taobao.org
```

되돌리기:

```sh
pnpm config set registry https://registry.npmjs.org
```

## 🔧 기술 스택

| 카테고리       | 기술/컴포넌트              | 버전          |
|----------------|----------------------------|---------------|
| 프레임워크     | Nuxt                       | ^3.14.159+    |
|                | Tauri                      | ^2.1.0        |
| UI 라이브러리  | Element Plus               | ^2.8.4        |
| 상태 관리      | Pinia                      | 2.1.7         |
| 유틸리티       | Vueuse                     | 10.11.0       |
| 빌드 도구      | Nuxi                       | lts           |
|                | Vite                       | lts           |
| 코드 품질      | ESLint                     | 8.56.0        |
|                | Prettier                   | 3.3.2         |
| 타입 검사      | TypeScript                 | 5.3.2         |
| 스타일링       | Sass                       | 1.77.6        |

## 🦾 트렌드

![JiwuChat Star History Chart](https://api.star-history.com/svg?repos=KiWi233333/jiwu-mall-chat-tauri&type=Date)

## 💬 연락처

- 이메일: [kiwi2333@qq.com](mailto:kiwi2333@qq.com)
- QQ: [1329634286](https://wpa.qq.com/msgrd?v=3&uin=1329634286&site=qqq&menu=yes)
- QQ 그룹: [939204073](https://qm.qq.com/q/iSaETNVdKw)
