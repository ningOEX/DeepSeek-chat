<script setup>
import { ref, watch } from "vue";
import { useDark, useToggle, useColorMode } from "@vueuse/core";

const isDark = useDark(); // 检测当前是否为深色模式
// const colorMode = useColorMode({
//   modes: {
//     dim: "dim",
//     violet: "violet",
//   },
// });
const toggleDark = useToggle(isDark); // 用于切换深色和浅色模式

const switchValue = ref(true);

// const modes = ["dark", "light", "dim"];

watch(
  () => switchValue.value,
  () => {
    toggleDark();
  },
);
</script>
<template>
  <div>
    <el-switch
      v-model="switchValue"
      class="ml-2"
      style="
        --el-switch-on-color: #ffffff;
        --el-switch-off-color: var(--dark-bgColor);
      "
    />
  </div>
</template>

<style>
.el-switch__core .el-switch__action {
  @apply bg-gray-500;
}
</style>
