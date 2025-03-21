<template>
  <el-container>
    <el-aside width="300px" class="border">Aside</el-aside>
    <el-container>
      <el-main
        ><el-container>
          <el-header
            ><el-affix :offset="0">
              <div class="relative">
                <div class="py-4 text-center text-xl">Hello user</div>
                <ButtonThemes class="absolute right-4 top-3" />
              </div> </el-affix
          ></el-header>
          <el-main>
            <el-scrollbar max-height="93vh">
              <chatCard class="relative pb-40" />
              <chatSearch class="absolute bottom-0 left-1/2 -translate-x-1/2" />
            </el-scrollbar>
          </el-main> </el-container
      ></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "@/stores/chatStore.js";
import ButtonThemes from "@/components/Button/ButtonThemes.vue";

const route = useRoute();
const chatStore = useChatStore();

// 根据路由参数获取当前对话
const chat = computed(() => chatStore.getChatById(route.params.chatId));
</script>
