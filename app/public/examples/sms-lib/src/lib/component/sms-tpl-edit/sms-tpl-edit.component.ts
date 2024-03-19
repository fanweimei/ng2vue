import { Component, ViewChild, OnInit, AfterViewInit } from "@angular/core";
import { MSG_APPTYEP, MSG_KEY, MSG_TYPE } from "../../shared/constant/msgType";
import { UntypedFormGroup } from "@angular/forms";
import { ModalHelper, _HttpClient } from "@delon/theme";
import { URLS } from "../../shared/constant/interface";
import { deepCopy } from "@delon/util";
import { ChangeDetectorRef } from "@angular/core";
import {
  AppPluginsFilterService,
  debounce,
  DialogService,
  EventService,
  hasSomePluginBySession,
  IccPatchDialogComponent,
  IccShortChainConfigComponent,
  invalidSendContent,
  MessageService,
  MsgconfHelperService,
  MsgTemplateEdit,
  PluginSign,
  tagSelect,
  TemplateEditData,
  TemplateService,
  varSelect,
  ValidatorFunc,
  IccCollapseWrapperComponent,
} from "@icc/common-lib";
import { ACLService } from "@delon/acl";
import { SmsAimLinkChooseComponent } from "../sms-aim-link-choose/sms-aim-link-choose.component";
import { SMS_TPL_STRATEGIES } from "./sms-tpl-strategies";

// 普通消息键值
const SMS_COMMON_MSG_TYPE = MSG_APPTYEP.common;
// M 消息键值
const SMS_AIM_MSG_TYPE = MSG_APPTYEP.aim;
@Component({
  // tslint:disable-next-line: component-selector
  selector: "icc-sms-tpl-edit",
  templateUrl: "./sms-tpl-edit.component.html",
  styleUrls: ["./sms-tpl-edit.component.less"],
})
export class SmsTplEditComponent implements MsgTemplateEdit, OnInit, AfterViewInit {
  constructor(
    private appPluginsService: AppPluginsFilterService,
    private dialogService: DialogService,
    private modal: ModalHelper,
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef,
    private http: _HttpClient,
    private messageService: MessageService,
    private aclService: ACLService,
    private msgconfHelperService: MsgconfHelperService,
    private eventService: EventService,
  ) {}
  @ViewChild("form", { static: false }) form: UntypedFormGroup;

  static SCENE = "icc-msg-tpl-edit";

  // isActivePanel = false;

  /** 数据源 */
  source: TemplateEditData = {};

  smsIcon: string;

  type = MSG_TYPE;

  debounceGetTplListFn: any;

  /** 是否是M消息 */
  isAimMsg = true;

  // 模板/贴片中是否含有短链
  hasShortUrl: boolean;

  // 是否发送过有 tplId 的请求
  isSendTplIdList: boolean = false;

  // 应用类型
  applicationType: number;

  // M 消息模板列表
  aimTemplateList: any[] = [];

  /** 辅助 -- 模板内容最大字数 */
  maxLength = 982;

  // 短信签名
  signature;

  /** 重要 -- 新增的空白模板 */
  standardTemplate = {
    id: 0,
    name: "",
    priority: null,
    msgType: this.type,
    bizTypeId: this.source.id,
    mediaList: [],
    contentType: null,
    content: "",
    title: "",
    copyValue: 0,
    operateType: "",
    isDefault: false,
    editIndex: -1,
    conditions: [],
    vIndex: 0,
    patchStrategy: [],
    // M 消息相关
    aimTemplateInfo: null, // 选中的 M 消息模板信息
    varMap: {
      aimTplId: null, // 模板 id
      aimTplName: null, // 模板名称
      aimUrl: "", // M消息链接
      // aimLink: "", // 链接 变量名
      aimJobId: null, // 链接任务 id
      aimJobCode: null,
      aimLinkType: null, // 链接类型
    },
  };

  showShorturl = false;

  // 贴片显隐控制
  showSalePatch = false;
  hasTemplateLibrary = true;

  // 当前模板
  nowTemplate: any = null;

  get isActivePanel() {
    return this.source.templates?.length === 0 ? false : !(this.source.templates || []).some(item => !item.active);
  }

  ngOnInit(): void {
    this.smsIcon = this.messageService.getMsgCollection()[MSG_KEY.toUpperCase()].icon;

    this.appPluginsService.forEach(item => {
      if (item.value === "1") {
        // 短链应用
        this.showShorturl = true;
      } else if (item.value === "2") {
        // 贴片应用
        this.showSalePatch = this.aclService.canAbility("template.patchGroup");
      }
    });

    // 获取账号签名
    this.getUserSignature();
    const config = this.messageService.getMessageConfigByName(MSG_KEY);
    this.hasTemplateLibrary = !!config.templateLibrary;
  }

  ngAfterViewInit(): void {
    // 是否有 M 消息插件
    let hasAimPlugin = hasSomePluginBySession(PluginSign.aim);
    if (hasAimPlugin && this.isAimMsg) {
      this.debounceGetTplListFn = debounce(this.getAimTemplateList, 1000);
      if (!this.isSendTplIdList && this.clickTempChoose()) {
        this.getAimTemplateList("", "");
      }
    }
  }

  // 获取账号签名
  getUserSignature() {
    this.http.post(URLS.getUserSignature.url).subscribe(res => {
      if (res.status === 0) {
        this.signature = res.data;
      } else {
        this.dialogService.notification.error("获取账号签名", res.errorMsg);
      }
    });
  }
  addTemplate = () => {
    const templates = this.templateService.getTpl(this.type);
    const standardTemplate = this.templateService.getStandardTpl(this.type);
    let count = templates.length + 1;
    return {
      ...deepCopy(standardTemplate),
      bizTypeId: this.source.id,
      msgType: this.type,
      // count,
      name: "模板名称" + count,
    };
  };

  // ============================= STRAT 接口实现 ============================= //
  setFormData(data: any): void {
    const { templates = [], applicationTypeList } = data;
    this.isAimMsg = applicationTypeList.includes(SMS_AIM_MSG_TYPE);
    this.applicationType = this.isAimMsg ? SMS_AIM_MSG_TYPE : SMS_COMMON_MSG_TYPE;

    this.processTemplate(templates);
    this.source = data;
    if (this.isAimMsg) {
      this.source?.templates?.forEach(item => {
        this.isSendTplIdList = true;
        this.getAimTemplateList(item.varMap.aimTplId || "", "");
        if (item.varMap?.aimJobId) {
          this.getAimLinkStatus(item);
        }
      });
    }
  }
  getData() {
    const dataList = deepCopy(this.source.templates?.filter(({ msgType }) => msgType === MSG_TYPE));
    const _variableList = this.hasEditableVariable();
    return _variableList.length > 0 ? this.addEditableVariable(_variableList, dataList) : dataList;
    // return deepCopy(this.source.templates?.filter(({ msgType }) => msgType === MSG_TYPE));
  }

  /* 获取移动端预览数据 */
  getMobilePreviewData() {
    const previewData: any = {
      isAim: this.isAimMsg,
      name: "短信",
      msgType: this.type,
      structureType: 0,
      sender: "10690XXXXX",
      date: "2月26日",
      week: "周二",
      time: "12:26",
      infos: [],
    };
    let content: any = null;
    if (this.source.templates?.length) {
      content = this.source.templates[0].content;
      if (this.isAimMsg) {
        content = this.source.templates[0]?.varMap?.aimTplId;
      }
    }
    previewData.infos.push({
      content,
    });
    return previewData;
  }

  // validate(): boolean {
  //   let result = true;

  //   const { ignoreAudit, useTmplMethod, templates } = this.source;

  //   // if (Number(useTmplMethod) === 2) {
  //   if (templates!.filter(item => item.state !== 0).length < 1) {
  //     this.dialogService.notification.error("短信模板", "融合模板开启状态下，每种消息类型必须要有一个可用的模板");
  //     return false;
  //   }
  //   // }

  //   // ----- 表单校验 -----
  //   if (templates!.length > 0) {
  //     this.cleanupDirty();

  //     const inValid = templates?.some(item => {
  //       if (!this.isAimMsg && (!item.valid || !item.name || !item.name.trim())) {
  //         this.dialogService.notification.error("短信模板", "短信模板名称不能为空，不能重复");
  //         return true;
  //       }

  //       // M 消息相关
  //       if (this.isAimMsg) {
  //         if (!item.name.trim()) {
  //           this.dialogService.notification.error("短信模板", "M 消息模板名称不能为空");
  //           return true;
  //         }

  //         if (!item?.varMap?.aimTplId || !item?.varMap?.aimTplName) {
  //           this.dialogService.notification.error("短信模板", "请选择 M 消息模板！");
  //           return true;
  //         }
  //         if (!item?.varMap?.aimJobId) {
  //           this.dialogService.notification.error("短信模板", "请选择 M 消息链接！");
  //           return true;
  //         }
  //         if (item?.varMap?.status === 0) {
  //           item.isContainStopAimTpl = true;
  //           // this.dialogService.notification.error("短信模板", "当前选择的M消息模板已停用，下发至终端可能解析失败，是否仍要保存？");
  //           // return true;
  //         }
  //         if (!item.content) {
  //           this.dialogService.notification.error("短信模板", "短信原文内容不能为空");
  //           return true;
  //         }
  //       }

  //       if (!item.content) {
  //         this.dialogService.notification.error("短信模板", "短信模板内容不能为空");
  //         return true;
  //       }

  //       if (invalidSendContent(item.content)) {
  //         this.dialogService.notification.error("短信模板", "短信模板内容包含了无效字符，'${'和'}'必须成对出现且不能嵌套");
  //         return true;
  //       }

  //       // 修复问题：执行条件为空，也能保存
  //       if (!item.isDefault && !item.conditions && Number(useTmplMethod) === 1) {
  //         this.dialogService.notification.error("短信模板", "消息模板缺少执行条件");
  //         return true;
  //       }

  //       // 智能模板 才有执行条件
  //       if (!item.isDefault && item.conditions && !item.conditions.value && Number(useTmplMethod) === 1) {
  //         if (item.conditions.length === 0) {
  //           this.dialogService.notification.error("短信模板", "消息模板缺少执行条件");
  //           return true;
  //         } else if (item.conditions.some(it => it.isEdit)) {
  //           this.dialogService.notification.error("短信模板", "请确保执行条件已经保存！");
  //           return true;
  //         }
  //       }
  //     });
  //     if (inValid) result = false;
  //   }
  //   return result;
  // }

  validate(): boolean {
    const { ignoreAudit, useTmplMethod, templates } = this.source;
    const validator = new ValidatorFunc(SMS_TPL_STRATEGIES);

    // 融合模板开启时：是否有一个可用的模板
    validator.add("public.isAvailableTpl", templates, "融合模板开启状态下，每种消息类型必须要有一个可用的模板");

    // 模板表单校验
    if (templates!.length > 0) {
      this.cleanupDirty();
      templates?.forEach(item => {
        // M消息校验
        if (this.isAimMsg) {
          validator.add("public.isEmptyWithTrim", item.name, "M 消息模板名称不能为空");
          validator.add("public.isEmpty", [item?.varMap?.aimTplId, item?.varMap?.aimTplName], "请选择 M 消息模板！");
          validator.add("public.isEmpty", item?.varMap?.aimJobId, "请选择 M 消息链接！");
          if (item?.varMap?.status === 0) {
            item.isContainStopAimTpl = true;
            // validator.add("aim.isStop", item?.varMap?.status, "当前选择的M消息模板已停用，下发至终端可能解析失败，是否仍要保存？");
          }
          validator.add("public.isEmpty", item.content, "短信原文内容不能为空");
        }
        // 普通消息校验
        else {
          validator.add("common.validName", item.valid, item.name, "短信模板名称不能为空，不能重复");
          validator.add("public.isEmpty", item.content, "短信模板内容不能为空");
        }
        // 通用校验 - 短信内容合法性校验
        validator.add("public.isInvalidContent", item.content, "短信模板内容包含了无效字符，'${'和'}'必须成对出现且不能嵌套");
        // 非默认执行且是智能模板，对执行条件进行如下校验
        if (!item.isDefault && Number(useTmplMethod) === 1) {
          validator.add("public.anyCondition", item.conditions, "消息模板缺少执行条件");
          validator.add("public.isEditCondition", item.conditions, "请确保执行条件已经保存！");
        }
      });
    }
    let errorMsg = validator.check();
    if (errorMsg) {
      this.dialogService.notification.error("短信模板", errorMsg);
      return false;
    }
    return true;
  }
  // ============================= END 接口实现 ============================= //

  // ============================= START 辅助方法 ============================= //

  /** 添加一些辅助的字段 */
  processTemplate(template: any, isNew: boolean = false) {
    if (template) {
      const _temp = isNew ? [template] : template;
      _temp.forEach((item, index) => {
        item.valid = true; // 是否是有效的模板名称
        item.vIndex = item.content ? item.content.length : 0; // content光标的位置
        item.copyValue = 0; // 复用了哪一个模板
        item.htmlId = isNew ? `msgType${this.type}${this.source.templates?.length}` : `msgType${this.type}${index}`; // 标识符
        this.generateFailContent(item);
      });
    }
  }

  /** 复用操作 */
  copyHandle(template: any, index: number) {
    let { content, title, conditions, operateType, htmlId, patchStrategy, longUrl, longUrlName, requireShortUrl, serverUrl, targetUrlId, traceType, msgType } =
      deepCopy(template);
    if (conditions) {
      conditions.forEach(it => {
        it.type = it.type.value === tagSelect.value ? tagSelect : varSelect;
      });
    } else {
      conditions = [];
    }
    const _t = deepCopy(this.source.templates![index]);
    _t.content = this.corpContent(content);
    _t.title = title;
    _t.conditions = conditions;
    _t.operateType = operateType;
    _t.copyValue = htmlId;
    _t.patchStrategy = patchStrategy;

    // 短链信息
    const standardMessageHelper: any = this.msgconfHelperService.getStandardMessageHelperInstance(msgType);
    if (!standardMessageHelper.shortUrlNotOfContent && requireShortUrl) {
      _t.longUrl = longUrl;
      _t.longUrlName = longUrlName;
      _t.requireShortUrl = requireShortUrl;
      _t.serverUrl = serverUrl;
      _t.targetUrlId = targetUrlId;
      _t.traceType = traceType;
    } else {
      _t.longUrl = "";
      _t.longUrlName = "";
      _t.requireShortUrl = false;
      _t.serverUrl = "";
      _t.targetUrlId = "";
      _t.traceType = "";
    }

    _t.selectTplName = "";

    this.source.templates![index] = deepCopy(_t);
    // 更新视图
    this.cdr.detectChanges();
    this.cleanupDirty();
  }

  /**
   * 选择模板
   */
  onSelectChange(selectedTemplate, index) {
    const { name, content, patchStrategy, longUrl, longUrlName, requireShortUrl, serverUrl, targetUrlId, traceType, variables } = deepCopy(selectedTemplate);
    const template = this.source.templates![index];
    template.name = name;
    template.content = content;
    template.patchStrategy = patchStrategy;
    template.longUrl = longUrl;
    template.longUrlName = longUrlName;
    template.requireShortUrl = requireShortUrl;
    template.serverUrl = serverUrl;
    template.targetUrlId = targetUrlId;
    template.traceType = traceType;
    template.displayIndex = 0;

    template.selectTplName = name;
    template.copyValue = 0;

    let vars = Object.values(JSON.parse(variables) || {});
    let tplVars = [];
    // 当前模板如果是模板库中的模板，则获取其变量
    if (this.nowTemplate?.variables) {
      tplVars = Object.values(JSON.parse(this.nowTemplate?.variables) || {});
    }
    this.eventService.change("varchange", { prev: tplVars || [], cur: vars });
    // this.eventService.change("varchange", { prev: template.vars || [], cur: vars });
    // template.vars = vars;
    this.source.templates![index] = deepCopy(template);
  }

  onOpenChange(template) {
    this.nowTemplate = template;
  }

  corpContent(content: string = ""): string {
    const sigLen = typeof this.signature === "string" ? this.signature.length : 0;
    return content.length + sigLen <= this.maxLength ? content : content.slice(0, this.maxLength - sigLen);
  }

  /** 手动驱动校验 */
  cleanupDirty() {
    setTimeout(() => {
      // tslint:disable-next-line: forin
      for (let a in this.form.controls) {
        this.form.controls[a].markAsDirty();
        this.form.controls[a].updateValueAndValidity();
      }
    }, 100);
  }

  /** 模板增加后的回调 */
  updateHandle() {
    const target = this.templateService.getLastTpl(this.type);
    this.processTemplate(target, true);
  }

  // ============================= END 辅助方法 ============================= //

  /**
   * 插入业务变量 （通过光标位置进行插值）
   * @param value 传入的变量值
   * @param template 模板对象
   */
  insertVar(value, index: any): void {
    const temp = deepCopy(this.source.templates![index]);
    let { content, vIndex } = temp;

    if (!this.canInsertContent(content, "${" + value.code + "}", this.maxLength)) {
      this.dialogService.notification.error("提示", "短信内容插入该变量之后，将会超出最大长度限制");
      return;
    }

    let aPart = content.slice(0, vIndex);
    let bPart = content.slice(vIndex);
    temp.content = aPart + "${" + value.code + "}" + bPart;
    // temp.vIndex = content.length + value.code.length + 3;
    temp.vIndex += value.code.length + 3;
    this.source.templates![index] = deepCopy(temp);
    this.generateFailContent(this.source.templates![index]);
  }

  /* 打开短链配置弹窗 */
  OpenShortChainModal(template) {
    // 添加校验：若模板中已含有贴片，且贴片含有链接，则不允许插入短链
    if (
      template.content.includes("${短链接}") ||
      (Array.isArray(template.patchStrategy) && template.patchStrategy.length > 0 && template.patchStrategy.some(item => item.requireShortUrl))
    ) {
      this.dialogService.notification.error("短信模板", "已存在短链,请擦除后再插入。");
      return;
    }
    if (!this.canInsertContent(template.content, "${短链接}", this.maxLength)) {
      this.dialogService.notification.error("提示", "短信内容插入短链接之后，将会超出最大长度限制");
      return;
    }
    this.modal.createStatic(IccShortChainConfigComponent, { template }, { size: "md" }).subscribe(result => {
      const { longUrlName, longUrl, serverUrl, traceType, targetUrlId, requireShortUrl } = result;
      // 无uuid，用 requireShortUrl 代替
      template.requireShortUrl = requireShortUrl;
      template.longUrlName = longUrlName;
      template.longUrl = longUrl;
      template.serverUrl = serverUrl;
      template.targetUrlId = targetUrlId;
      template.traceType = traceType;
    });
  }

  /**
   * 设置光标的位置
   * @param event 点击事件
   * @param template 模板对象
   */
  setCursorPositionByEvent(event, template: any): void {
    let field = event.target;
    template.vIndex = field.selectionStart;
  }

  setCursorOffset($event, template: any): void {
    template.vIndex = $event;
  }

  /** 贴片选择弹窗 */
  openPatchModal(template: any, contentType) {
    if (!this.checkPatch(template.patchStrategy, template.requireShortUrl)) return;
    this.modal
      .create(
        IccPatchDialogComponent,
        {
          msgType: template.msgType,
          contentType,
          groupUrl: URLS.templatePatchGroup.url,
          itemUrl: URLS.templatePatchGroupItem.url,
          content: template.content,
          // 1. 模板是否已插入短链 2. 模板所包含的贴片是否已有短链
          hasShortUrl: this.hasShortUrl,
        },
        { size: "lg" },
      )
      .subscribe(result => this.afterHandleForPatchSelected(template, result));
  }
  /** 贴片选择后处理 */
  afterHandleForPatchSelected(template, result) {
    if (!this.canInsertContent(template.content, "${" + result.groupName + "}", this.maxLength)) {
      this.dialogService.notification.error("贴片添加失败", "短信内容插入贴片之后，将会超出最大长度限制");
      return;
    }

    if (template.patchStrategy) {
      template.patchStrategy = [...template.patchStrategy, result];
    } else {
      template.patchStrategy = [result];
    }
  }

  /** 贴片检测 */
  checkPatch(patchStrategy: any[], requireShortUrl: any): boolean {
    if (patchStrategy && patchStrategy.length >= 3) {
      this.dialogService.notification.warning("提示", `最多只能添加三个贴片`);
      return false;
    }
    // 贴片中是否含有短链
    if (Array.isArray(patchStrategy) && patchStrategy.length > 0) {
      this.hasShortUrl = patchStrategy.some(item => item.requireShortUrl);
    }
    // 模板是否插入短链
    this.hasShortUrl = this.hasShortUrl || !!requireShortUrl;
    return true;
  }

  // 监听 fake-textarea 输入事件监听
  handelValueChange($event, template) {
    const { patchStrategy } = template;
    /* 当有贴片时，输入的内容长度大于总长度则不赋值处理 */
    if ($event && ($event.length > this.maxLength)) {
      return;
    }
    // template中的value 与 faketextarea中的value同步
    template.content = $event;
    // 根据 content中的值，动态删除多余的 pasters
    if (patchStrategy) {
      template.patchStrategy = patchStrategy.filter(v => {
        return template.content.indexOf("${" + v.groupName + "}") > -1;
      });
    }
    // 监听短链是否存在 决定是否置空 targetUrl
    if (!template.content.includes("${短链接}")) {
      template.longUrlName = "";
      template.longUrl = "";
      template.serverUrl = "";
      template.traceType = "";
      template.requireShortUrl = false;
      this.hasShortUrl = false;
    }
    // M 消息短信原文改变，则同步变更解析失败预览内容
    if (this.isAimMsg) {
      this.generateFailContent(template);
    }
    this.cdr.detectChanges();
  }

  // segments
  calcSegments(value) {
    let length = value.length + (this.signature ? this.signature.length + 2 : 0);
    if (length <= 70) {
      return 1;
    } else {
      return Math.ceil(length / 67);
    }
  }

  canInsertContent(content: string = "", insert: string = "", maxLen: number): boolean {
    return (isNaN(content?.length) ? 0 : content.length) + insert.length <= maxLen;
  }
  // ====================== M 消息相关 ==========================
  // 打开M消息链接选择弹窗
  OpenAimLinkChoose(item) {
    if (!item?.varMap?.aimTplId) {
      this.dialogService.notification.warning("选择M消息链接", `请先选择M消息模板`);
      return;
    }
    this.modal.createStatic(SmsAimLinkChooseComponent, { templateId: item?.varMap?.aimTplId }, { size: "lg" }).subscribe(result => {
      if (item.varMap) {
        item.varMap.aimUrl = result.linkType === 1 ? result?.aimUrl || "{M消息群发链接}" : "{M消息个性链接}";
        // 由于后台代码限制，以下两个字段传 string 类型
        item.varMap.aimJobId = result?.jobId + "";
        item.varMap.aimLinkType = result?.linkType + "";
        item.varMap.aimJobCode = result?.jobCode || "";
      } else {
        item.varMap = {
          aimUrl: result.linkType === 1 ? result?.aimUrl || "{M消息群发链接}" : "{M消息个性链接}",
          // 由于后台代码限制，以下两个字段传 string 类型
          aimJobId: result?.jobId + "",
          aimLinkType: result?.linkType + "",
          aimJobCode: result?.jobCode || "",
        };
      }
      this.generateFailContent(item);
      this.getAimLinkStatus(item);
    });
  }

  // 获取 M 消息模板列表
  getAimTemplateList(tplId: string, tplName: string): void {
    if (!this.aimTplAcl) {
      return;
    }
    let params = {
      tplId: tplId ? tplId : "",
      tplName: tplName ? tplName : "",
      aimAccountName: "",
      templateType: -1,
      factorys: [],
      auditStatus: -1,
      status: -1,
      updateUser: "",
      start: null,
      end: null,
    };
    setTimeout(() => {
      this.http.post(URLS.aimTemplateList.url, params).subscribe(res => {
        if (res.status === 0) {
          this.aimTemplateList = res.data;
        }
      });
    }, 100);
  }

  // M消息模板ID搜索
  tplIdsearch(tplId: string) {
    this.debounceGetTplListFn(tplId, "");
  }

  get aimTplAcl() {
    return this.aclService.canAbility("menu.business.library.aim.listAndDetail");
  }

  clickTempChoose() {
    if (!this.aimTplAcl) {
      this.dialogService.notification.warning("M消息模板查询", "用户暂无权限");
      return false;
    }
    return true;
  }

  // M消息模板名称搜索
  tplNamesearch(tplName: string) {
    this.debounceGetTplListFn("", tplName);
  }

  // M消息模板ID/名称选择改变
  aimTemplateChange(tpl: any, selTplId: string) {
    let selTpl = this.aimTemplateList.find(item => item.tplId === selTplId);
    tpl.aimLinkStatus = undefined;
    if (tpl.varMap) {
      tpl.varMap.aimTplId = selTpl.tplId;
      tpl.varMap.aimTplName = selTpl.tplName;
      tpl.varMap.aimUrl = null;
      tpl.varMap.aimJobId = null;
      tpl.varMap.aimJobCode = null;
      tpl.varMap.aimLinkType = null;
    } else {
      tpl.varMap = {
        aimTplId: selTpl.tplId,
        aimTplName: selTpl.tplName,
        aimUrl: null,
        aimJobId: null,
        aimJobCode: null,
        aimLinkType: null,
      };
    }
    this.generateFailContent(tpl);
  }

  // 生成解析失败内容
  generateFailContent(item: any) {
    console.log("item :>> ", item);
    item.failContent = {
      fileContent: (this.signature ? "【" + this.signature + "】" : "") + (item.content || "") + (item.varMap?.aimUrl ? " " + item.varMap?.aimUrl : ""),
      shortUrlStrategy: item.requireShortUrl
        ? {
            longUrlName: item.longUrlName,
            longUrl: item.longUrl,
            serverUrl: item.serverUrl,
            traceType: item.traceType,
          }
        : null,
    };
  }

  // 获取 M 消息链接状态
  getAimLinkStatus(item) {
    this.http.get(URLS.getAimLinkListStatus.url + "?jobId=" + item.varMap?.aimJobId).subscribe(res => {
      if (res.status === 0) {
        item.aimLinkStatus = res.data.linkStatus;
      } else {
        this.dialogService.notification.error("获取 M 消息链接状态", res.errorMsg);
      }
    });
  }

  //---------------------------------- 签约插件START ---------------------------------------

  // 判断是否包含嵌套变量
  hasEditableVariable() {
    const temp = (this.source.variableBinds || []).filter(item => {
      const ext = this.convertJson(item.extParams);
      return !!ext?.customTitle && !!ext?.customDesc;
    });
    return temp;
  }

  // 将嵌套变量加入varMap中，以键值对的方式 code: desc
  addEditableVariable(variableList, list, desc = null) {
    (list || []).forEach(({ content, varMap }) => {
      variableList.forEach(v => {
        // 与后端约定，内容中插入了嵌套变量，则在varMap中插入键值对
        if (content.includes(v.code)) {
          const ext = this.convertJson(v.extParams);
          // 有则更新，没有则取原值
          varMap[v.code] = desc || ext?.customDesc;
        }
      });
    });
    return list;
  }

  // JSON字符串转换
  convertJson(data) {
    return JSON.parse(data || "{}");
  }

  //---------------------------------- 签约插件END ---------------------------------------
}
