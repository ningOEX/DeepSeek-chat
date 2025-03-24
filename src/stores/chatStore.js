import { defineStore } from "pinia";
import { ref } from "vue";
// 你可以任意命名 `defineStore()` 的返回值，但最好使用 store 的名字，同时以 `use` 开头且以 `Store` 结尾。
// (比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中 Store 的唯一 ID。
export const useChatStore = defineStore("chat", () => {
  // 其他配置...
  const isSend = ref(false); // 是否发送第一条信息
  const isBuffer = ref(false); //是否正在输出流
  const loading = ref(false); // 是否在请求中
  const isShrink = ref(false); // 是否收起
  const firstMessage = ref('') // 第一条消息

  // keyInputValue
  const inputValue = ref("");

  function setValue() {
    inputValue.value = ' ';
  }

  return {
    isBuffer: isBuffer.value,
    loading: loading.value,
    isSend: isSend.value,
    inputValue: inputValue.value,
    setValue,
    isShrink: isShrink.value,
    firstMessage:firstMessage.value,
  };
});


// export const useChatStore = defineStore('chat', {
//   state: () => ({
//     isSend:false,// 是否发送第一条信息
//     isBuffer:false,//是否正在输出流
//     loading:false,// 是否在请求中
//     isShrink:false,// 是否收起
//   }),
//   getters: {
//
//   },
// })