<template>
  <div class="">
    <ButtonThemes></ButtonThemes>
  </div>
</template>

<script setup>
import { useDark, useToggle } from '@vueuse/core'
import ButtonThemes from"@/components/Button/ButtonThemes.vue"
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<style lang="scss" scoped>

</style>