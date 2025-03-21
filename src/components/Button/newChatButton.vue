<script setup lang="ts">
import { ChatDotSquare } from "@element-plus/icons-vue";

import { useRouter } from "vue-router";
import { useChatStore } from "@/stores/chatStore.js";

const router = useRouter();
const chatStore = useChatStore();

const handleNewChat = () => {
  console.log("暂停开发");
  return;
  const chatId = chatStore.createChat(); // 新建对话
  router.push({ name: "Chat", params: { chatId } }); // 跳转到新对话页面
};
</script>

<template>
  <div class="flex items-center justify-center py-10 pb-12 cursor-pointer">
    <div
      class="flex items-center gap-1 w-22 bg-blue-500 py-1 px-2 rounded-tl-lg rounded-br-lg"
      @click="handleNewChat"
    >
      <el-icon color="#fff"><ChatDotSquare /></el-icon>
      <span class="text-sm text-white">新增对话</span>
    </div>
  </div>
</template>

<style scoped></style>
