<script setup >
import { useDark, useToggle, useColorMode } from '@vueuse/core';

const isDark = useDark();  // 检测当前是否为深色模式
const colorMode = useColorMode({
  modes:{
    dim:'dim',
    violet:'violet',
  },
})
const toggleDark = useToggle(isDark);  // 用于切换深色和浅色模式

const modes = ['dark','light','dim','violet']

</script>
<template>
<div>
  <el-dropdown placement="top-end">
    <el-button>主题</el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="item in modes" :key="item" @click="colorMode = item">{{item}}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</div>
</template>

<style >
.dark {
  background: #252525;
  color: white;
}
.dim {
  background: grey;
  color: white
}
.violet{
  background: #722ed1;
  color: white;
}


</style>