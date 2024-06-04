// 变量节点
export enum VarType {
  common = 0, // 普通变量
  ref = 1, // ref响应式变量
  reactive = 2, // reactive响应式变量
  prop = 3, // prop父级传递过来的变量
  emit = 4, // emit事件变量
  model = 5, // 需要双向数据绑定的变量
  proxy = 6,
  computed = 7, // computed类型（对应ng中get函数）
  watchref = 8, // 对普通ref的watch
  watchprop = 9 // 对prop的watch
}

export interface VarItem {
  varType: VarType;
  name: string;
  value?: string | undefined | null;
  type?: string | undefined;
  isOptional?: boolean;
  isStatic?: boolean;
  isLinkTemp?: boolean;
}

export interface MethodItem {
  content: string;
  name: string;
  isAsync?: boolean;
  blockContent?: string;
  isArrow?: boolean;
}

export enum SSrv {
  modalHelper = "ModalHelper",
  http = "_HttpClient",
  dialog = "DialogService",
  cdr = "ChangeDetectorRef",
  confhelper = "MsgconfHelperService",
  message = "MessageService",
  modalRef = "NzModalRef",
  plugin = "MsgPluginFilterService",
  acl = "ACLService",
  router = "Router",
  ufb = "UntypedFormBuilder",
  fb = "FormBuilder",
  notification = "NzNotificationService",
  nzModal = "NzModalService",
  encrypt = "EncryptService",
  token = "TokenService",
  iToken = "ITokenService",
  nzMessage = "NzMessageService",
  eventSer = "EventService",
  route = "ActivatedRoute"
}

export interface SSrvResult {
  start?: number;
  end?: number;
  content: string;
  origin: string;
}
