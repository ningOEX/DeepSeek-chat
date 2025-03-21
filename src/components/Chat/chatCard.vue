<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from "vue";
import newChatButton from "@/components/Button/newChatButton.vue";
import { useChatStore } from "@/stores/chatStore.js";
import markdownIt from "@/services/markdown/md-config";
import { serverModel } from "@/services/model/serverModel";
import { ElMessage } from "element-plus";

import {buildCodeBlock} from "@/services/markdown/code-block"

// icon
import user_avatar from "@/assets/img/logo.png";
import deepSeek from "@/assets/img/DeepSeek.png";
import icon_toggle_up from "@/assets/img/icon_toggle_up.png";
import icon_toggle_button from "@/assets/img/icon_toggle_button.png";
import copy from "@/assets/img/copy.png";
import reset from "@/assets/img/reset.png";

// api
import { generateChat } from "@/api/index.js";

const chatStore = useChatStore();
const emits = defineEmits(["scrollButton"]);

let thinkingLoadingText = "思考中..."; // 正在思考的提示文本
let errText = "获取模型数据不成功，稍后重试";
const obj_type = {
  bot: "assistant",
  user: "user",
  tool: "tool",
  system: "system",
};
const model_type = {
  model_R1: "deepSeek-R1",
  model_Company: "model_Company_deepSeek-R1",
};

const chatBox = ref(null);
const payload = ref({
  model: "jumping_ai/deepseek-r1-abliterated:14b", // 模型名称
  prompt: "",
  stream: true, // 是否启用流式响应
  options: {
    temperature: 0.7,
    max_tokens: 500,
  },
});

/**
 * 核心流程
 * setp 1 获取流数据处理输出
 * setp 2 将用户消息添加到 chatBox
 * setp 3 将流式输出数据进行处理（markdown处理/按钮添加处理/点击事件处理）
 * setp 4
 */

interface ChatMessageList {
  userMessage: string; //用户消息
  initAImessageCopy: string; //原始数据 用于复制
  id: string;
}

const chatMessageList = ref<ChatMessageList>([]); //chat list

watch(
  () => chatStore.inputValue,
  async (newVal) => {
    createUserMessage(); // 创建一条用户消息
    scrollChatBox();
    await generateChatHandle(); // 请求一条回复消息
  },
);

// ------------------------------------------ 请求模块 start
/**
 * 请求 chat
 */
const generateChatHandle = async () => {
  chatStore.loading = true;

  // 先消息上屏
  const messageId = generateTimestamp();
  addMessage(thinkingLoadingText, obj_type.bot, messageId);
  scrollChatBox();
  const res = await generateChat(payload.value);
  chatStore.loading = false;
  if (res.status === 200) {
    chatStore.isBuffer = true; // 开始读取流

    // 回复消息
    await handleChat(res, messageId);

    if (!chatStore.isBuffer) {
      //绑定事件
      bindToggleEvent(messageId);

      // 绑定事件/添加复制按钮
      bindHoverEvent(messageId);
    }
  } else {
    dynamicAddMessage(errText, messageId);
    console.error("状态 err", res);
  }
  chatStore.$reset(); //清空输入内容
};
// ======================
// ======================
// ======================
// ======================
// ------------------------------------------ 处理模块 start
/**
 * 处理聊天数据
 * @param res
 * @param messageId 时间戳id
 */
const handleChat = async (res: any, messageId) => {
  // 获取可读流
  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  let done = false;
  let chunk = "";

  while (!done) {
    const { done: chunkDone, value } = await reader.read();
    // 流结束
    done = chunkDone;

    if (done) {
      chatStore.isBuffer = false; // 切换状态 流读取完毕
      const chat = {
        userMessage: payload.value.prompt,
        initAImessageCopy: chunk,
        id: messageId,
      };
      chatMessageList.value.push(chat);
      console.log("buffer 结束");
      break;
    }

    // 解码并处理数据
    const _chunk = decoder.decode(value, { stream: true });
    chunk += JSON.parse(_chunk).response;
    // 实时将读取到的数据显示在 chatBox
    dynamicAddMessage(chunk, messageId);
  }
};

/**
 * 滚动chatBox底部
 */
const scrollChatBox = () => {
  const chatBox = document.getElementById("chatBox");
  emits("scrollButton", chatBox.clientHeight + 400);
};

/**
 * 动态实时更新回复消息内容
 * @param message 消息
 * @param messageId id（时间戳）
 */
const dynamicAddMessage = (message, messageId) => {
  console.log(messageId);
  const content = document.getElementById(messageId);

  if (content) {
    const newContent = processThinkContent(message);
    content.innerHTML = newContent.innerHTML;
  }

  // 滚动到底部显示最新消息
  scrollChatBox();
};

//test
const insertReasoningElem = (el) => {
  const reasoningEl = document.createElement("div");
  const parent = el.parentNode;

  if (!parent) return null;
  parent.insertBefore(reasoningEl, el);
  reasoningEl.className = "cmba-reasoning-content";

  const detailsEl = document.createElement("details");
  detailsEl.open = true;
  reasoningEl.appendChild(detailsEl);

  const summaryEl = document.createElement("summary");
  summaryEl.innerHTML = "思考内容🤔";
  detailsEl.appendChild(summaryEl);

  const reasoningTextDiv = document.createElement("div");
  reasoningTextDiv.className = "markdown-content";
  detailsEl.appendChild(reasoningTextDiv);

  return reasoningTextDiv;
};

/**
 * copy
 */
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);

    ElMessage({
      message: "文本已复制到剪贴板",
      type: "success",
    });
  } catch (err) {
    console.error("无法复制文本: ", err);
    ElMessage({
      message: "无法复制文本" + err,
      type: "error",
    });
  }
};

/**
 * 绑定盒子鼠标移动上去事件
 */
const bindHoverEvent = (messageId) => {
  const content = document.getElementById(messageId);
  //创建copy/reset
  const footerBtn_ = createFooterCopyResetBtn();
  content.appendChild(footerBtn_);

  // 按钮所在盒子
  const footerContainer = content.querySelector(".footer-container");
  content.addEventListener("mouseover", () => {
    // 移进
    footerContainer.style.opacity = 1;
  });
  content.addEventListener("mouseout", () => {
    // 移出
    footerContainer.style.opacity = 0;
  });

  // 所有按钮注册事件
  const footerBtn = content.querySelectorAll(
    ".footer-container .footer_content img",
  );
  if (content) {
    footerBtn.forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.alt === "copy") {
          const text = chatMessageList.value.filter(
            (res) => res.id === messageId,
          )[0].initAImessageCopy;
          console.log(text);
          await copyToClipboard(text);
        } else {
          console.log("reset");
        }
      });
    });
  }
};

/**
 * 绑定展开/隐藏按钮的事件
 */
const bindToggleEvent = (messageId) => {
  const div = document.getElementById(messageId);
  const headerContent = div.querySelector(".headerContent");
  const toggle = div.querySelector(".headerContent .toggle_btn img");
  const thinkContent = div.querySelector(".think-content");
  toggle.style.display = "block";
  headerContent.addEventListener("click", () => {
    if (thinkContent.style.display === "none") {
      thinkContent.style.display = "block";
      toggle.src = icon_toggle_button;
    } else {
      thinkContent.style.display = "none";
      toggle.src = icon_toggle_up;
    }
  });
};

// ======================
// ======================
// ======================
// ======================
// ------------------------------------------ dom生成模块 start
/**
 * 添加一条消息到 chatBox
 * @param message 消息
 * @param sender 发送人
 * @param mid id
 */
const addMessage = (message, sender, mid) => {
  const messageBox = document.createElement("div");
  const messageDiv = document.createElement("div");
  const avatar = document.createElement("img");
  if (sender === obj_type.user) {
    // 用户消息
    messageBox.classList.add("user");
    messageDiv.classList.add("user_message");
    messageDiv.innerHTML = message;
    avatar.classList.add("user_avatar");
    avatar.src = user_avatar;
    messageBox.appendChild(messageDiv);
    messageBox.appendChild(avatar);
    chatBox.value.appendChild(messageBox);
  }
  if (sender === obj_type.bot) {
    // ai 助理
    const avatar = createBotAvatar();
    const p = document.createElement("p");
    messageBox.id = mid;
    messageBox.classList.add("chatBotMessage");
    p.innerText = message;
    messageBox.appendChild(avatar);
    messageBox.appendChild(p);
    chatBox.value.appendChild(messageBox);
  }
};

/**
 * 创建一个bot头像
 */
const createBotAvatar = () => {
  // 头部盒子
  const headerContent = document.createElement("header");
  const messageDiv = document.createElement("div");
  const avatar = document.createElement("img");
  const span = document.createElement("span");

  headerContent.classList.add("headerContent");
  // 展开收起 think
  const btn = createToggleButton();

  messageDiv.classList.add("bot_message");
  avatar.src = deepSeek;
  span.innerText = "DeepSeek-R1";
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(span);
  headerContent.appendChild(messageDiv);
  headerContent.appendChild(btn);
  return headerContent;
};

/**
 * 创建一条用户消息
 */
const createUserMessage = () => {
  payload.value.prompt = chatStore.inputValue;
  addMessage(payload.value.prompt, obj_type.user);
};

/**
 * 创建footer copy/reset 按钮
 */
const createFooterCopyResetBtn = () => {
  const footerContainer = document.createElement("div");
  const footerContent = document.createElement("div");
  const icon_copy = document.createElement("img");
  const icon_reset = document.createElement("img");
  // class
  footerContainer.classList.add("footer-container");
  footerContent.classList.add("footer_content");

  //
  icon_copy.src = copy;
  icon_copy.alt = "copy";
  icon_reset.src = reset;
  icon_reset.alt = "reset";

  footerContent.appendChild(icon_copy);
  footerContent.appendChild(icon_reset);

  footerContainer.appendChild(footerContent);

  return footerContainer;
};

/**
 * 创建一个收起展开按钮
 */
const createToggleButton = () => {
  const div = document.createElement("div");
  const icon_img = document.createElement("img");
  div.className = "toggle_btn";
  icon_img.src = icon_toggle_up;
  div.appendChild(icon_img);
  return div;
};

/**
 * 处理 <think> 标签内容
 * @param {string} message 消息内容
 * @returns {HTMLElement} 处理后的消息元素
 */
const processThinkContent = (message) => {
  const messageContent = document.createElement("div");
  messageContent.classList.add("content");

  // 创建头像
  const avatar = createBotAvatar();
  messageContent.appendChild(avatar);
  // 创建文本元素
  const textDiv = document.createElement("div");
  textDiv.classList.add("message-content");

  // 检查是否包含 <think> 标签
  const thinkMatch = message.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    // 提取 <think> 标签内容
    const thinkContent = thinkMatch[1];
    const thinkDiv = document.createElement("div");
    thinkDiv.classList.add("think-content");
    if (!markdownIt.render(thinkContent)) {
      thinkDiv.innerHTML = "无think~";
    } else {
      thinkDiv.innerHTML = markdownIt.render(thinkContent);
    }
    thinkDiv.style.display = "none";

    // 去除消息中的 <think> 标签内容，即回答内容
    const messageText = message.replace(/<think>[\s\S]*?<\/think>/, "");
    textDiv.innerHTML = markdownIt.render(messageText);
    textDiv.classList.remove("think-content");
    messageContent.appendChild(thinkDiv);
  } else {
    // 不包含 <think> 标签，直接添加文本内容
    textDiv.classList.add("think-content");
    textDiv.innerHTML = markdownIt.render(message);
  }

  if (message === errText) {
    messageContent.appendChild(avatar);
  }
  messageContent.appendChild(textDiv);

  return messageContent;
};

// ======================
// ======================
// ======================
// ======================
// ------------------------------------------ utils start
/**
 * 生成一个时间戳字符串
 * @returns
 */
const generateTimestamp = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${timestamp}-${randomNum}`;
};

/**
 * 切换模型
 */
const toggleModel = (modelType) => {
  if (modelType === model_type.model_R1) {
    payload.value.model = serverModel().deepSeekR1;
  } else {
    payload.value.model = serverModel().jumping_ai;
  }
};
// ======================
// ======================
// ======================
// ======================

const copyHandler = (event)=>{
  console.log('123',event)
}
onMounted(async () => {
  await nextTick();

  const el = document.getElementById('1742523171514-822129')
  console.log(el)
  buildCodeBlock(el)

  // toggleModel(model_type.model_R1); // 模型初始化
  // createUserMessage(); // 创建一条用户消息
  // await generateChatHandle(); // 请求一条回复消息
});
</script>

<template>
  <div
    id="chatBox"
    ref="chatBox"
    class="w-[96%] lg:w-[720px] xl:w-[820px] m-auto p-2 min-h-[93vh] relative"
  >
    <div id="1742523171514-822129" class="chatBotMessage">
      <header class="headerContent">
        <div class="bot_message">
          <img src="/src/assets/img/DeepSeek.png" /><span>DeepSeek-R1</span>
        </div>
        <div class="toggle_btn">
          <img
            src="/src/assets/img/icon_toggle_up.png"
            style="display: block"
          />
        </div>
      </header>
      <div class="think-content" style="display: none">
        <p>
          嗯，用户让我写一个JS输出“Hello
          World”。这应该是一个很基础的练习。首先，我需要确认用户的需求是什么。他们可能刚开始学习JavaScript，想要了解如何在控制台中打印字符串。
        </p>
        <p>
          那我应该怎么开始呢？我记得在JavaScript里，使用console.log()函数是常见的做法。所以，我可以写一段代码，里面包含"Hello
          World"字符串，并用console.log调用它。
        </p>
        <p>
          比如，代码可能是这样：console.log(“Hello World”);
          这样应该就能在浏览器的控制台中看到输出了。嗯，这个方法简单直接，适合新手理解。
        </p>
        <p>
          那用户可能需要的是一个完整的示例，包括HTML和CSS吗？或者只是纯JavaScript？考虑到他们只需要输出字符串，可能不需要额外的结构，所以只需要简单的JS代码就可以了。
        </p>
        <p>
          另外，我应该确保代码是正确的，没有语法错误。检查一下引号是否正确，字符串内容有没有拼写错误。确认无误后就可以提供给用户了。
        </p>
      </div>
      <div class="message-content">
        <p>
          当然可以！以下是一个简单使用 JavaScript 输出 “Hello World” 的示例：
        </p>
        <pre><code class="lang-html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;输出Hello World&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;hello world&lt;/h1&gt;
    &lt;script&gt;
        console.log("Hello World");
    &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>
        <p>
          这段代码会在浏览器中显示 “Hello World”。<code>console.log()</code>
          函数用于在控制台输出文本、数字或其他变量值。
        </p>
        <p>如果你只是想看到输出，也可以直接使用纯 JavaScript：</p>
        <pre><code class="lang-javascript">console.log("Hello World");
</code></pre>
        <p>这样在控制台中会输出：</p>
        <pre><code>Hello World
</code></pre>
      </div>
      <div class="footer-container" style="opacity: 0">
        <div class="footer_content">
          <img src="/src/assets/img/copy.png" alt="copy" /><img
            src="/src/assets/img/reset.png"
            alt="reset"
          />
        </div>
      </div>
    </div>
  </div>
</template>
