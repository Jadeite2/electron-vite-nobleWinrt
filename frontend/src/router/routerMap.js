/**
 * 基础路由
 * @type { *[] }
 */
const constantRouterMap = [
  {
    path: '/',
    name: 'Root',
    redirect: { name: 'HomeIndex' },
    children: [
      {
        path: 'index',
        name: 'HomeIndex',
        meta: {
          title: '蓝牙测试页面',
          level: 1
        },
        component: () => import('@/views/index/index.vue')
      },
    ]
  },
]

export default constantRouterMap