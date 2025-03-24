<script setup lang="ts">
import { ref } from "vue";
import { useChatStore } from "@/stores/chatStore";

// icon
import left_up from "@/assets/img/left.png";
import right_up from "@/assets/img/right.png";
import add_chat from "@/assets/img/add_chat.png";
import deepSeek from "@/assets/img/DeepSeek.png";

const chatStore = useChatStore();

const isOpen = ref(false);

const clickHandle = () => {
  chatStore.isShrink = !chatStore.isShrink;
  isOpen.value = chatStore.isShrink;
};

/**
 * 该功能待优化 目前仅刷innerHTML
 */
const newChat = ()=>{
  const chatBox = document.getElementById('chatBox')
  chatBox.innerHTML = ''
  chatStore.firstMessage = ''
}

</script>

<template>
  <div class="overflow-x-hidden">
    <el-container>
      <el-header>
        <div v-if="!isOpen" class="flex justify-between items-center p-4">
          <h1 class="text-2xl">DeepSeek-R1</h1>
          <img
            @click="clickHandle"
            :src="left_up"
            class="cursor-pointer"
            alt="left_up"
          />
        </div>
        <div v-else>
          <img :src="deepSeek" class="w-10 h-10 m-auto mt-4" alt="logo" />
        </div>
      </el-header>
      <el-main>
        <el-scrollbar height="80vh">
          <div v-if="!isOpen" class="p-4">
            <div
                @click="newChat"
              class="flex items-center gap-2 bg-blue-500 w-32 py-2 px-4 text-white my-4 rounded-lg"
            >
              <img :src="add_chat" class="w-6" alt="add_chat" />
              <span>新增对话</span>
            </div>
          </div>
          <div v-else class="grid items-center gap-4">
            <img
              @click="clickHandle"
              :src="right_up"
              class="cursor-pointer w-8 m-auto mt-2"
              alt="left_up"
            />
            <img
              :src="add_chat"
              class="bg-blue-500 w-7 p-1 cursor-pointer rounded-lg m-auto"
              alt="add_chat"
            />
          </div>
        </el-scrollbar>
      </el-main>
      <el-footer>
        <div v-if="!isOpen" class="p-4 text-sm text-gray-500/40"></div>
      </el-footer>
    </el-container>
  </div>
</template>

<style scoped></style>
