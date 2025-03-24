<script setup>
import { ref, computed } from "vue";
import { Position, Top } from "@element-plus/icons-vue";
import { useChatStore } from "@/stores/chatStore.js";

import myLoading from "@/components/myLaoding.vue";


const chatStore = useChatStore(); //chat 仓库

const keyValue = ref(""); // 输入内容

const isLoading = computed(() => {
  return chatStore.loading;
});

const isBuffer = computed(()=>{
  return chatStore.isBuffer
})

/**
 * enter 事件
 * @param event
 */
const handleEnter = (event) => {
  // 处理 Enter 键事件
  event.preventDefault();
  handleSend();
};

/**
 * send发送事件
 */
const handleSend = () => {
  if(chatStore.isBuffer) return
  if (!chatStore.isSend) {
    chatStore.firstMessage = keyValue.value;
    chatStore.isSend = true;
  }
  if(chatStore.isSend && chatStore.firstMessage.length <= 0){
    chatStore.firstMessage = keyValue.value;
  }
  chatStore.inputValue = keyValue.value;
  keyValue.value = "";
};

const pauseRender = ()=>{
  chatStore.Get_Reader.cancel()
}


</script>

<template>
  <div class="w-full">
    <div
      v-if="!chatStore.isSend"
      class="text-center grid gap-6 mb-6 mt-72 px-2"
    >
      <div class="text-2xl">我是DeepSeek，很高兴见到你</div>
      <div>
        我可以帮你写代码、读文件、写作各种创意内容，请把你的任务交给我吧~
      </div>
    </div>
    <!--  输入框盒子  -->
    <div
      class="rounded-2xl bg-white p-2 w-[96%] lg:w-[720px] xl:w-[820px] m-auto px-2"
    >

      <!-- 输入框 -->
      <el-input
        v-model="keyValue"
        :autosize="{ minRows: 2 }"
        type="textarea"
        placeholder="给DeepSeek 发送消息"
        resize="none"
        @keydown.enter="handleEnter"
        class=""
      />
      <!-- 按钮 -->
      <div class="mt-2">
        <div class="pr-2 flex gap-2 justify-end items-center">
          <div v-if="!isLoading">
            <el-icon
                v-if="!isBuffer"
                :color="keyValue.length ? '#0084ff' : '#b9bbc0'"
                size="24"
                class="cursor-pointer"
                @click="handleSend"
            ><Position
            /></el-icon>
            <div v-else class="pause" @click="pauseRender">| |</div>
          </div>
          <myLoading class="mb-1" v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.el-textarea__inner {
  box-shadow: none;
}

.el-textarea__inner:focus,
.el-textarea__inner:hover {
  box-shadow: none;
  outline: none;
}

pre {
  white-space: pre-wrap; /* 允许换行 */
  word-wrap: break-word; /* 允许在单词中断行 */
}
.think {
  @apply border bg-blue-500;
}

.think_content {
  @apply grid gap-3;
}

.think_content p {
  white-space: pre-wrap; /* 允许换行 */
  word-wrap: break-word; /* 允许在单词中断行 */
  @apply overflow-x-hidden;
}
</style>
