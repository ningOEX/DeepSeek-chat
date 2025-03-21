<script setup>
import { ref, computed } from "vue";
import { useChatStore } from "@/stores/chatStore.js";

import ButtonThemes from "@/components/Button/ButtonThemes.vue";
import chatSearch from "@/components/Chat/chatSearch.vue";
import chatCard from "@/components/Chat/chatCard.vue";
import myAside from "@/components/Chat/myAside.vue";

import icon_menu from "@/assets/img/menu.png";

// use
const chatStore = useChatStore();

const scrollRef = ref(null);

const scrollButtonHandle = (scrollHeight) => {
  const scroll = scrollRef.value;
  scroll.setScrollTop(scrollHeight);
};

const width_ = computed(() => {
  if (chatStore.isShrink) {
    return "60px";
  } else {
    return "300px";
  }
});
</script>

<template>
  <div class="common-layout">
    <chatSearch v-if="!chatStore.isSend" />
    <el-container v-else>
      <el-aside class="hidden md:block border" :width="width_">
        <my-aside></my-aside>
      </el-aside>
      <el-container>
        <el-header
          ><el-affix :offset="0">
            <div class="relative">
              <img
                class="block md:hidden absolute left-4 top-4 w-8"
                :src="icon_menu"
                alt=""
              />
              <div
                class="py-4 text-center text-xl whitespace-nowrap w-[80%] m-auto overflow-x-hidden text-ellipsis"
              >
                Hello user
              </div>
            </div>
          </el-affix></el-header
        >
        <el-main>
          <el-scrollbar ref="scrollRef" max-height="93vh">
            <chatCard
              class="relative pb-40"
              @scrollButton="scrollButtonHandle"
            />
            <chatSearch class="absolute bottom-4 left-1/2 -translate-x-1/2" />
          </el-scrollbar>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
.el-scrollbar__view {
  overflow-x: hidden;
}
</style>
