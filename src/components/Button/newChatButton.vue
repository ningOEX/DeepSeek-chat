<script setup lang="ts">
import { ChatDotSquare } from "@element-plus/icons-vue";

const emits = defineEmits(['newChat'])

const handleNewChat = () => {
  emits('newChat',{})
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
