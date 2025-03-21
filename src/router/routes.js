const routes = [
  { path: "/", component: () => import("@/views/chat/index.vue") },
  {
    path: "/chat/:chatId?", // 动态路由，chatId 为对话的唯一标识
    name: "Chat",
    component: () => import("@/views/chat/Chat.vue"),
    props: true, // 将路由参数作为 props 传递给组件
  },
];

export default routes;
