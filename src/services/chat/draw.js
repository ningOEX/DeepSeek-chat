const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const topicList = document.getElementById("topicList");
const indexSelect = document.getElementById("indexSelect");
const modelSelect = document.getElementById("modelSelect");
const atIndexSelect = document.getElementById("atIndexSelect");
const tipWords = document.getElementById("tipWords");

let sessionId = null; // 会话ID
let chatId = null; // 对话ID
let isLinked = false; // 是否已连接
let thinkingLoadingText = "思考中..."; // 正在思考的提示文本

const obj_type = {
  bot: "assistant",
  user: "user",
  tool: "tool",
  system: "system",
};

/**
 * 从响应中获取错误信息
 */
async function getResMessage(response) {
  const data = await response.json();
  return data.message || "未知错误";
}

/**
 * 错误提示
 *
 * @param {*} title
 * @param {*} response
 */
async function alertResError(title, response) {
  alert(`${title || "请求错误"}: ${await getResMessage(response)}`);
}

/**
 * 启动会话
 */
async function startSession() {
  initSessionId();
  const response = await fetch(`${ApiConfig.host}/start/${sessionId}`, {
    method: "POST",
  });
  if (response.ok) {
    console.log("会话启动成功");
    isLinked = true;
    getSession();
  } else {
    alertResError("会话启动失败", response);
  }
}

/**
 * 获取会话信息
 */
async function getSession() {
  const response = await fetch(`${ApiConfig.host}/session/${sessionId}`, {
    method: "POST",
  });
  if (response.ok) {
    const data = await response.json();
    const models = data.modelList;
    const indexs = data.indexList;
    const chats = data.chatList;

    // 知识库选项生成
    let selectedIndex = indexSelect.value;
    indexSelect.innerHTML =
      `<option value="null">无</option>` +
      indexs
        .map(
          (o) =>
            `<option value="${o}" ${o === selectedIndex ? "selected" : ""}>${o}</option>`,
        )
        .join("");
    atIndexSelect.innerHTML = indexSelect.innerHTML;

    // 模型选项生成
    let selectedModel = modelSelect.value;
    modelSelect.innerHTML = models
      .map(
        (o) =>
          `<option value="${o}" ${o === selectedModel ? "selected" : ""}>${o}</option>`,
      )
      .join("");

    // 对话列表生成
    chats.reverse();
    topicList.innerHTML = chats
      .map(
        (o) =>
          `<li id="${o.id}" onclick="selectChat('${o.id}')" class="chat-li ${o.id === chatId ? "selected" : ""}">
                <span>${o.title}</span>
                <span class="icon" onclick="removeChat('${o.id}')">&#10006;</span>
                </li>`,
      )
      .join("");
    if (!chatId) {
      if (chats.length > 0) {
        // 默认选择第一个话题
        selectChat(chats[0].id);
      } else {
        clearChatMessage();
      }
    }
  } else {
    alertResError("会话信息获取失败", response);
  }
}

/**
 * 获取对话信息
 */
async function getChat() {
  const response = await fetch(
    `${ApiConfig.host}/chat/${sessionId}/${chatId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  if (response.ok) {
    const data = await response.json();
    const messages = data.messages;
    modelSelect.value = data.model;
    messages.forEach((v) => {
      addMessage(v.content, v.role);
    });
  } else {
    alertResError("对话信息获取失败", response);
  }
}

/**
 * 创建新对话
 */
async function createChat(title = "新的对话") {
  // 生成一个新的对话ID
  chatId = generateTimestamp();
  // 获取用户选择的模型
  const selectedModel = modelSelect.value;
  if (!selectedModel) {
    alert("请选择模型");
    return;
  }

  const response = await fetch(
    `${ApiConfig.host}/newchat/${sessionId}/${chatId}/${selectedModel}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipWords: tipWords.value,
        title: title,
      }),
    },
  );
  if (response.ok) {
    console.log("话题创建成功");
    userInput.focus();
    clearChatMessage();
    await getSession();
  } else {
    alertResError("话题创建失败", response);
  }
}

/**
 * 发送消息的函数
 * @returns
 */
async function sendMessage() {
  // 判断发送按钮非禁用时可发
  if (sendBtn.disabled) {
    return;
  }

  // 获取用户输入的消息
  const message = userInput.value;
  if (!message) {
    alert("请输入消息");
    return;
  }

  // 如果当前没有对话则先创建一个对话
  if (!chatId) {
    await createChat(message);
  }

  // 禁用发送按钮
  sendBtn.disabled = true;

  // 用户消息上屏
  addMessage(message, obj_type.user);

  // 清空输入框
  userInput.value = "";

  // 先消息上屏
  const messageId = generateTimestamp();
  addMessage(thinkingLoadingText, obj_type.bot, messageId);

  // 发送消息到后端API并获取回复
  await sendQuestion(message, messageId);

  // 恢复发送按钮
  sendBtn.disabled = false;

  // 重新获取对话列表
  await getSession();
}

/**
 * 发送消息到后端API并获取回复
 * @param {*} message
 * @param {*} messageId 消息ID
 * @returns
 */
async function sendQuestion(message, messageId) {
  const indexId = indexSelect.value;
  const response = await fetch(
    `${ApiConfig.host}/send/${sessionId}/${chatId}/${indexId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    },
  );

  if (response.ok) {
    // 使用 Response.body.getReader() 来读取流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let chunk = "";

    while (!done) {
      // 每次读取一个 chunk
      const { value, done: chunkDone } = await reader.read();
      done = chunkDone;
      // 将读取的 chunk 转为字符串并拼接
      chunk += decoder.decode(value, { stream: true });
      // 实时将读取到的数据显示在 chatBox
      dynamicAddMessage(chunk, messageId);
    }
  } else {
    const data = await getResMessage(response);
    dynamicAddMessage("请求错误：" + data, messageId);
  }
}

/**
 * 清除对话上下文
 */
async function clearChatContext() {
  const response = await fetch(
    `${ApiConfig.host}/clear/${sessionId}/${chatId}`,
    {
      method: "POST",
    },
  );
  if (response.ok) {
    console.log("对话上下文已清除");
    clearChatMessage();
  } else {
    alertResError("清除上下文失败", response);
  }
}

/**
 * 移除对话
 * @param {*} id
 */
async function removeChat(id) {
  // 阻止事件冒泡
  event.stopPropagation();
  if (confirm("确定要移除该对话吗？")) {
    const response = await fetch(
      `${ApiConfig.host}/remove/${sessionId}/${id}`,
      {
        method: "POST",
      },
    );
    if (response.ok) {
      chatId = null;
      getSession();
    } else {
      alertResError("移除对话失败", response);
    }
  }
}

/**
 * 停止会话
 */
async function stopSession() {
  const response = await fetch(`${ApiConfig.host}/stop/${sessionId}`, {
    method: "POST", // 使用POST请求停止会话
  });
  if (response.ok) {
    console.log("会话已停止");
  } else {
    alert("清除上下停止会话失败文失败：" + response.statusText);
  }
}

/**
 * 话题切换
 * @param {*} topic
 */
function selectChat(id) {
  if (id == chatId) {
    return;
  }

  // 设置当前对话id
  chatId = id;
  // 先移除.chat-li 的 .selected 选择状态
  document.querySelectorAll(".chat-li").forEach((element) => {
    element.classList.remove("selected");
  });
  // 再给当前点击的元素添加 .selected 选择状态
  document.getElementById(id).classList.add("selected");
  // 清空聊天记录
  clearChatMessage();
  // 重新获取聊天记录
  getChat();
}

/**
 * 停止接受对话
 */
function stopReceivingMessages() {}

/**
 * 消息上屏
 * @param {*} message 消息内容
 * @param {*} sender  消息发送者
 * @param {*} id    消息ID
 */
function addMessage(message, sender, id) {
  // 只显示用户和机器人的消息
  if (sender !== obj_type.user && sender !== obj_type.bot) return;
  let isUser = sender === obj_type.user; // 判断是否为用户消息
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(isUser ? "user-message" : "bot-message");

  // 创建头像元素
  const avatar = document.createElement("img");
  avatar.classList.add("avatar");
  avatar.src = isUser ? "img/user-avatar.png" : "img/bot-avatar.png"; // 根据发送者选择头像

  // 处理 <think> 标签内容
  const messageContent = processThinkContent(message);
  if (id) {
    messageContent.id = id;
  }

  // 根据消息来源设置头像和消息文本的位置
  if (isUser) {
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(avatar);
  } else {
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
  }

  // 将消息添加到对话框中
  chatBox.appendChild(messageDiv);

  // 滚动到底部显示最新消息
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * 处理 <think> 标签内容
 * @param {string} message 消息内容
 * @returns {HTMLElement} 处理后的消息元素
 */
function processThinkContent(message) {
  const messageContent = document.createElement("div");
  messageContent.classList.add("content");

  // 创建文本元素
  const textDiv = document.createElement("div");
  textDiv.classList.add("message-content");

  // 思考中的临时加载中消息
  if (message == thinkingLoadingText) {
    textDiv.innerHTML = `<div class="loading"><i></i><i></i><i></i><i></i><i></i><p>${thinkingLoadingText}</p></div>`;
  } else {
    // 检查是否包含 <think> 标签
    const thinkMatch = message.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      // 提取 <think> 标签内容
      const thinkContent = thinkMatch[1];
      const thinkDiv = document.createElement("div");
      thinkDiv.classList.add("think-content");
      thinkDiv.innerHTML = marked.parse(thinkContent);
      thinkDiv.style.display = "none";

      const toggleButton = document.createElement("button");
      toggleButton.innerHTML = '展开思考内容 <i class="down"></i>';
      toggleButton.classList.add("toggle-button");
      bindToggleEvent(toggleButton, thinkDiv);

      // 去除消息中的 <think> 标签内容，即回答内容
      const messageText = message.replace(/<think>[\s\S]*?<\/think>/, "");
      textDiv.innerHTML = marked.parse(messageText);
      messageContent.appendChild(toggleButton);
      messageContent.appendChild(thinkDiv);
    } else {
      // 不包含 <think> 标签，直接添加文本内容
      textDiv.innerHTML = marked.parse(message);
    }
  }

  messageContent.appendChild(textDiv);
  return messageContent;
}

/**
 * 动态实时更新消息内容
 * @param {*} message
 * @param {*} id
 */
function dynamicAddMessage(message, id) {
  const content = document.getElementById(id);
  if (content) {
    const newContent = processThinkContent(message);
    content.innerHTML = newContent.innerHTML;

    // 重新绑定展开/隐藏按钮的事件
    const toggleButton = content.querySelector(".toggle-button");
    const thinkDiv = content.querySelector(".think-content");
    if (toggleButton && thinkDiv) {
      bindToggleEvent(toggleButton, thinkDiv);
    }
    // 滚动到底部显示最新消息
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

/**
 * 绑定展开/隐藏按钮的事件
 * @param {HTMLElement} toggleButton 按钮元素
 * @param {HTMLElement} thinkDiv 思考内容元素
 */
function bindToggleEvent(toggleButton, thinkDiv) {
  toggleButton.onclick = function () {
    if (thinkDiv.style.display === "none") {
      thinkDiv.style.display = "block";
      toggleButton.innerHTML = '隐藏思考内容 <i class="up"></i>';
    } else {
      thinkDiv.style.display = "none";
      toggleButton.innerHTML = '展开思考内容 <i class="down"></i>';
    }
  };
}

/**
 * 消息清屏
 */
function clearChatMessage() {
  chatBox.innerHTML = "";
}

/**
 * 动态调整输入框高度
 */
function adjustHeight() {
  let scrollHeight = userInput.scrollHeight;
  if (scrollHeight > 60 && scrollHeight < 150) {
    userInput.style.height = "auto";
    userInput.style.height = `${scrollHeight}px`;
  }
}

/**
 * 生成一个时间戳字符串
 * @returns
 */
function generateTimestamp() {
  const timestamp = Date.now();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const uniqueTimestamp = `${timestamp}-${randomNum}`;
  return uniqueTimestamp;
}

/**
 * 初始化会话ID
 * @returns
 */
function initSessionId() {
  sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = generateTimestamp();
    localStorage.setItem("sessionId", sessionId);
  }
}

/**
 * 插入换行符
 */
function insertLineBreak() {
  const start = userInput.selectionStart;
  const end = userInput.selectionEnd;
  userInput.value =
    userInput.value.substring(0, start) + "\n" + userInput.value.substring(end);
  userInput.selectionStart = userInput.selectionEnd = start + 1;
  adjustHeight();
}

/**
 * 插入@知识库
 */
function insertAtIndexInput() {
  const indexId = atIndexSelect.value;
  if (indexId) {
    // 如果用户输入内容开头有 “@index_xxx ”，则删除这段内容
    const regex = /^@\w+\s+/;
    userInput.value = userInput.value.replace(regex, "");
    if (indexId !== "null") {
      userInput.value = `@${indexId} ${userInput.value}`;
    }
  }
  userInput.focus();
}

// 监听键盘事件
userInput.addEventListener("keydown", function (event) {
  // Enter（发送消息）
  if (event.key === "Enter" && !event.altKey) {
    event.preventDefault();
    sendMessage();
  }
  // Alt + Enter （换行）
  else if (event.key === "Enter" && event.altKey) {
    event.preventDefault();
    insertLineBreak();
  }
});

// 页面加载时自动启动会话
startSession();

// 在页面卸载时停止会话
window.addEventListener("beforeunload", function () {
  // stopReceivingMessages();
  // stopSession();
});
