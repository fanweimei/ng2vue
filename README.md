### 适用场景
已经存在的基于Angular框架、Ng-zorro-antd UI库开发的项目，需要迁移到Vue环境，所以需要将Angular组件代码自动转为为Vue组件（语法转换），目前只支持单个组件的转换，转换之后需要手动进行适当的调整

### 安装

```bash
npm install
```

### 运行

```bash
npm run start
```

### 文件转换

找到 `app/module/bar/controller/home.ts` 文件, 修改路径参数：

```ts
const content = await ng2Vue.exec(
  "D:/code/icc-web-view/frontkit/icc-admin/plugins/workwx-lib/src/lib/component/workwx-modal-detail",
  "D:/code/icc-web-view/frontkit/vue-admin/projects/icc-msgs/packages/workwx/components/workwx-modal-detail",
  {
    props: ["title", "mtContent", "varMap", "isAimMsg", "isMo", "applyId"],
  }
);
```

- 第一个参数：angular 组件的路径，可以具体到.component.ts 路径；也可以到上一次的目录，比如`D:/code/icc-web-view/frontkit/icc-admin/projects/base/src/app/routes/sys/user`，找的组件是`D:/code/icc-web-view/frontkit/icc-admin/projects/base/src/app/routes/sys/user/user.component.ts`
- 第二个参数：vue 组件的存放路径，可是是具体到.vue 路径；也可使目录比如`D:/code/icc-web-view/frontkit/vue-admin/projects/base/src/views/sys/user`，实际存放路径`D:/code/icc-web-view/frontkit/vue-admin/projects/base/src/views/sys/user/index.vue`
- 配置参数，比如针对弹窗组件，在弹窗组件中没有写明@Input 的变量是不能别识别为 props 变量的，可以在这个参数中配置 props 数组（数组中是变量名）

### 执行

在浏览器输入http://127.0.0.1:7001的地址

### 注意事项

1. 关于联动解析：目前只有弹窗组件，也就是一个页面打开了弹窗组件，就会把联动组件一并解析了，其它情况目前只支持单个组件
2. 启动后是一个 node 服务，没有之前 schematics 询问的功能，所以修改了路径，一定要先保存，在刷新 7001 的地址或者重新打开 7001 地址，防止把上一个已经改好的组件重写了

### 实现的原理说明
https://www.yuque.com/fanweimei/ggw8vm/gdxc3gpv7xer0kl1
