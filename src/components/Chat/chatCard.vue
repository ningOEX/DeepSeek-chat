<script setup>
import { ref, watch, onMounted, computed, nextTick } from "vue";
import newChatButton from "@/components/Button/newChatButton.vue";
import { useChatStore } from "@/stores/chatStore.js";
import markdownIt from "@/services/markdown/md-config";
import { serverModel } from "@/services/model/serverModel";
import { ElMessage } from "element-plus";
import {createTooltip} from "@/utils/chat.js"

import {
  buildCodeBlock
} from "@/services/markdown/code-block";

import {renderBlock} from "@/services/markdown/md-render.js"
// icon
import user_avatar from "@/assets/img/logo.png";
import deepSeek from "@/assets/img/DeepSeek.png";
import icon_toggle_up from "@/assets/img/icon_toggle_up.png";
import icon_toggle_button from "@/assets/img/icon_toggle_button.png";
import copy from "@/assets/img/icon_copy.png";
import reset from "@/assets/img/icon_reset.png";

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

const chatMessageList = ref([]); //chat list

watch(
  () => chatStore.inputValue,
  async (newVal) => {
    if (newVal === '') return
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
      await bindToggleEvent(messageId);

      // 绑定事件/添加复制按钮
      bindHoverEvent(messageId);

      bindCopyResetHover(messageId);
    }
  } else {
    dynamicAddMessage(errText, messageId);
    console.error("状态 err", res);
  }
  chatStore.inputValue = ''
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
const handleChat = async (res, messageId) => {
  // 获取可读流
  // const reader = res.body?.getReader();
  chatStore.Get_Reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  let chunk = "";

  while (true) {
    const { done, value } = await chatStore.Get_Reader.read();
    if (done) {
      // 流结束
      chatStore.isBuffer = false; // 切换状态 流读取完毕
      const chat = {
        userMessage: payload.value.prompt,
        initAImessageCopy: chunk,
        id: messageId,
      };
      chatMessageList.value.push(chat);
      chatStore.inputValue = ''
      console.log("buffer 结束");
      break;
    }

    // 解码并处理数据
    try {
      const _chunk = decoder.decode(value, { stream: true });
      chunk += JSON.parse(_chunk).response;
      // 实时将读取到的数据显示在 chatBox
      dynamicAddMessage(chunk, messageId);
    } catch (e) {
      console.error("解码失败", e);
    }
  }
};

/**
 * 滚动chatBox底部
 */
const scrollChatBox = () => {
  const chatBox = document.getElementById("chatBox");
  emits("scrollButton", chatBox.clientHeight + 600);
};

/**
 * 动态实时更新回复消息内容
 * @param message 消息
 * @param messageId id（时间戳）
 */
const dynamicAddMessage = (message, messageId) => {
  const content = document.getElementById(messageId);
  if (content) {
    const newContent = processThinkContent(message, messageId);
    content.innerHTML = newContent.innerHTML;
    // 代码美化
    buildCodeBlock(content);
  }
  // 滚动到底部显示最新消息
  scrollChatBox();
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
 * reset 重新生成
 * @param messageId id
 * @param userMsg 用户消息
 */
const resetContentMessage = async (messageId, userMsg) => {
  /**
   * 重新获取数据前，重置chatStore input,新的值进行赋值 出发监听事件
   * 1.清除dom，通过父chatBox删除节点
   * 2.根据上条userMassage重新请求数据
   */
  chatMessageList.value = chatMessageList.value.filter(
    (chat) => chat.id !== messageId,
  );
  const oldDom = document.getElementById(messageId);
  chatBox.value.removeChild(oldDom);
  chatStore.inputValue = ''
  chatStore.setValue(userMsg);
  console.log(userMsg)
  payload.value.prompt = userMsg

  scrollChatBox();
  await generateChatHandle(); // 请求一条回复消息
};

/**
 * 绑定盒子鼠标移动上去事件
 */
const bindHoverEvent = (messageId) => {
  const content = document.getElementById(messageId);
  try {
    //创建按钮
    const footerBtn_ = createFooterCopyResetBtn();
    content.appendChild(footerBtn_);

    // 按钮所在盒子
    const footerContainer = content.querySelector(".footer-container");
    content.addEventListener("mouseover", () => {
      footerContainer.style.opacity = 1;
    });
    content.addEventListener("mouseout", () => {
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
            const userMsg = chatMessageList.value.filter(
                (chat) => chat.id === messageId,
            );
            await resetContentMessage(messageId, userMsg[0].userMessage);
          }
        });
      });
    }
  }catch (e) {
    console.log('bindHoverEvent',e)
  }

};

/**
 * 绑定展开/隐藏按钮的事件
 */
const bindToggleEvent = async (messageId) => {
  await nextTick(); //节点已有
  const div = document.getElementById(messageId);
  try {
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
  }catch (e){
    console.log('获取dom失败',e)
  }
};

/**
 * 绑定鼠标移动上去提示
 * @param messageId
 */
const bindCopyResetHover = (messageId) => {
  const content = document.getElementById(messageId);
  try {
    const footerBtn = content.querySelector(".footer-container .footer_content");
    createTooltip(footerBtn.querySelector(".icon_copy"), "复制");
    createTooltip(footerBtn.querySelector(".icon_reset"), "重答");
  }catch (e) {
    console.log('bindCopyResetHover',bindCopyResetHover)
  }
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
  // think.innerText = '思考中🤔'
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

const createIcon = (src, alt, className) => {
  const icon = document.createElement("img");
  icon.src = src;
  icon.alt = alt;
  icon.classList.add(className);
  return icon;
};

/**
 * 创建footer copy/reset 按钮
 */
const createFooterCopyResetBtn = () => {
  const footerContainer = document.createElement("div");
  const footerContent = document.createElement("div");

  // class
  footerContainer.classList.add("footer-container");
  footerContent.classList.add("footer_content");

  // 创建图标
  const iconCopy = createIcon(copy, "copy", "icon_copy");
  const iconReset = createIcon(reset, "reset", "icon_reset");

  // 将图标添加到内容中
  footerContent.append(iconCopy, iconReset); // 使用 append 批量添加
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
 * @param {string} messageId 消息id
 * @returns {HTMLElement} 处理后的消息元素
 */
const processThinkContent = (message, messageId) => {
  const messageContent = document.createElement("div");
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
    thinkDiv.style.display = "block";

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
    textDiv.classList.remove("think-content");
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

onMounted(async () => {
  await nextTick();

  toggleModel(model_type.model_Company); // 模型初始化
  createUserMessage(); // 创建一条用户消息
  await generateChatHandle(); // 请求一条回复消息
});
</script>

<template>
  <div class="w-[96%] lg:w-[720px] xl:w-[820px] m-auto p-2 min-h-[93vh]">
    <div
        id="chatBox"
        ref="chatBox"
        class="relative"
    >
    </div>

  </div>

</template>
