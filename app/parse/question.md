## Html 文件转换中容易出错的地方

- se 元素转为 a-form-item，error => rules 容易不全
- nz-form-item 元素转为 a-form-item， nzErrorTip => rules 大概率是不完全准确的
- se/nz-form-item 转到 a-form-item，还需要配合 ts 文件的解析，validator 方法需要替换正确，且没有考虑到表单控件（或者 nz-form-control）有多个的场景
- se/nz-form-item 转到 a-form-item，对于 label 宽度的计算可能不太准确，se/nz-form-label 都可以设置具体的 label 宽度，但是 a-form-item 只能是栅格布局
- nz-tooltip/nz-dropdown 需要显示相应的弹框的内容，工具中只处理了跟 nz-tooltip/nz-dropdown 同级的 template 查找，移到转换后的 a-tooltip/a-dropdown 元素内
- nz-select 转为 a-select，
  （1）对于本地分页的场景替换为 icc-select，但是需要配合 ts 解析替换:options 指定的方法名；
  （2）对于需要 show-search 的场景，如果 nz-option 第一个是全部，需要手动修改；
  （3）对于 nzValue 对应的值如果是一个对象，在 a-select 中是无法识别的，只能 string/number 类型的值，需要手动更改

  ## ts 解析容易出错的地方

  ### ViewChild/ViewChildren

  在 ts 文件中通过组件类名获取组件引用的，html 中无法定位 ref，需要手动加上

  ### form

  vue 不推荐实时获取整个表单校验是否通过，也就是在提交按钮上不设置 disable 的属性，点击提交之后再来一次所有字段校验，校验不通过给出错误提示

  ### 解析的顺序

  （1）解析 html 模板中引用的方法，以及方法中调用的方法
  （2）解析剩余方法（生命周期函数的方法）
  （3）在解析方法中收集 st.reset 中的 params 参数
  （4）拼凑 icc-dynamic-table 的 tableRequest 方法（需要获取 url/method 以及以及步骤三中获取的 params 参数
  （5）解析 icc-dynamic-table 中的 columns 属性

### http

angular http 是 HttpClient，这里只处理的 subscribe => then ，至于 pipe 未处理
如果不存在 pipe，转为 http（promise），如果存在 pipe，将 promise 做转换

### 子组件

因为在 Angular 中以模块为单位，不需要导入子组件， vue 中需要手动加上

### props

对于@Input()的属性，如果在 angular 代码中修改了其中的值，改成 v-model 的属性

### 对于模板中使用到的变量，（要么是 props/ref/reactive）

（1）但是当这个变量值不会变动的时候，定义成 const 普通的变量常量更合适

### 需要修改的点

（1）关于 reactive/ref 变量，在模板中引用了，但是值没有更改过的应该是普通变量，有修改过才定义 reactive/ref 变量
（2）变量 html 节点的时候：同步 ref 的引用名字，图标对应的变量需要在 import 中引入
（3）sf 组件的处理
（3-1）表单自定义校验方法纠正
（4）icc-multi-line-cell 替换为 icc-table-mtext
（5）a-tree 对应的 select/check 方法的参数需要修改

（6）现在是 antd 按需引入了，缺少的组件需要手动导入
（7）通过引用子组件，调用子组件的方法，转到 vue 后，需要手动在子组件中导出方法(defineExpose)

（8）form 没有变成 a-form

### 无法解决的问题/没有解决的问题

（1）关于 reactive/ref 变量的转化（无法解决）

- 模板引用的变量定义为 ref 没有问题
- html 模板中使用到的变量定义为（基本类型和数组转为 ref, 对象转为 react），这种情况下是存在误判的，因为模板中引用的变量可能是常量，只有那些模板中引用到了，并且在方法体中有修改的变量才是响应式变量 ref(reactive)，如果只是使用，值并没有改变，应该是 const 普通变量，但是这种情况很难处理某个变量是否在方法体中有被修改，改变有多种形式（赋值等于、数组 push/shift 等、对象只改变某个属性字段）

（2）a-tree 对应的 select/check 方法的参数需要修改（频率低）

（3）constructor 构造函数没有处理（构造函数中的方法体需要搬到 vue 的频率低）
（4）对于 modal 弹窗组件，在 Angular 中可以不用写@Input 也能传参，但是工具是不能识别的，工具目前是单个组件处理的，所以需要自己手动加上@Input，在 Angular 中加上@Input 没有任何影响的
