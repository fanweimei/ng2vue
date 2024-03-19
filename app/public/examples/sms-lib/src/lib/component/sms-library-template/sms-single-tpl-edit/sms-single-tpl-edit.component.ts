import { ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { ACLService } from "@delon/acl";
import { ModalHelper, _HttpClient } from "@delon/theme";
import {
  AppPluginsFilterService,
  DialogService,
  IccPatchDialogComponent,
  IccShortChainConfigComponent,
  IccLibraryVariableComponent,
  UCReq,
  invalidSendContent,
} from "@icc/common-lib";
import { _ } from "ajv";
import { URLS } from "../../../shared/constant/interface";
import { MSG_APPTYEP, MSG_CONTENT_TYPE, MSG_TYPE } from "../../../shared/constant/msgType";

interface SMSLibraryTemplate {
  id: string | number;
  name: string;
  content: string;
  msgType: string | number;
  applicationType: number;
  patchStrategy?: any[];
  requireShortUrl?: boolean;
  serverUrl?: string;
  longUrlName?: string;
  longUrl?: string;
  targetUrlId?: string;
  traceType?: string;
  vIndex?: string | number;
  oldPageIndex?: string | number;
  variables?: any;
}

@Component({
  selector: "lib-sms-single-tpl-edit",
  templateUrl: "./sms-single-tpl-edit.component.html",
  styleUrls: ["./sms-single-tpl-edit.component.css"],
})
export class SmsSingleTplEditComponent implements OnInit {
  static NAME = "icc-tpl-library-edit";

  constructor(
    private router: Router,
    private appPluginsService: AppPluginsFilterService,
    private dialogService: DialogService,
    private modal: ModalHelper,
    private cdr: ChangeDetectorRef,
    private http: _HttpClient,
    private aclService: ACLService,
  ) {}

  pageMode: string;

  pageTitle: string;

  editRecord: SMSLibraryTemplate;

  appUniquenessCheckReq: UCReq;

  isHasSalePatchPlugin: boolean;

  maxLength: number = 982;

  saveLoading: boolean;

  nameModelOpts = { standalone: false };

  requrestUrls = {
    valid: URLS.msgTemplateLibraryNameValid.url,
    add: URLS.msgTemplateLibraryAdd.url,
    edit: URLS.msgTemplateLibraryEdit.url,
  };

  isFireChange: boolean;

  applicationType = MSG_APPTYEP.common;

  validChars = true;

  isHasShowUrlPlugin: boolean;

  // 变量个数上限
  varMaxNum: number = 20;

  // 绑定的变量数组
  variableBinds: any[] = [];

  // 传递的校验方法
  hadUsedFn: Function;

  // 模板/贴片中是否含有短链
  hasShortUrl: boolean;

  subject: string = "短信模板";

  @ViewChild("libraryVar")
  libraryVar: IccLibraryVariableComponent;

  ngOnInit(): void {
    this.initPageByRoute();
    this.editRecord = JSON.parse(sessionStorage.getItem("MSG_LIBRARY_TEMP")!);
    this.editRecord.applicationType = this.applicationType;
    this.editRecord.vIndex = 0;
    // 初始化变量校验的方法
    this.hadUsedFn = _var => {
      return this.variableInvokedByTemplates(_var);
    };
    if (this.pageMode !== "detail") {
      const { id, name, variables = "" } = this.editRecord;
      if (variables && this.pageMode !== "add") {
        const variableArr = Object.values(JSON.parse(variables) || {});
        if (variableArr.length > 0) {
          this.http.post(URLS.getVariableInfoByCodeList.url, variableArr).subscribe(res => {
            if (res.status === 0) {
              this.variableBinds = res.list;
            } else {
              this.dialogService.notification.error("获取变量信息失败", res.errorMsg);
            }
          });
        }
      }
      let params =
        this.pageMode === "add"
          ? { name, msgType: MSG_TYPE, applicationType: this.applicationType }
          : { id, name, msgType: MSG_TYPE, applicationType: this.applicationType };
      this.appUniquenessCheckReq = {
        method: "get",
        url: this.requrestUrls.valid,
        index: "name",
        params: params,
      };
    }
    this.appPluginsService.forEach(item => {
      if (item.value === "1") {
        this.isHasShowUrlPlugin = true;
      } else if (item.value === "2") {
        this.isHasSalePatchPlugin = this.aclService.canAbility("template.patchGroup");
      }
    });
  }

  onSave() {
    const reqUrl = this.pageMode === "add" ? this.requrestUrls.add : this.requrestUrls.edit;
    this.http.post(reqUrl, this.editRecord).subscribe(res => {
      if (res.status === 0) {
        this.onBack();
        setTimeout(() => {
          this.dialogService.notification.success("保存成功", this.editRecord.id ? "编辑模板成功！" : "新增模板成功！");
        }, 200);
      } else {
        this.dialogService.notification.error("保存失败", res.errorMsg, { isRender: false });
      }
    });
  }

  onBack() {
    this.router.navigate(["/icc-standard/business/library/sms"], { queryParams: { oldPageIndex: this.editRecord.oldPageIndex || 1 } });
  }

  initPageByRoute() {
    this.pageMode = this.router.url.slice(this.router.url.lastIndexOf("/") + 1);
    switch (this.pageMode) {
      case "add":
        this.pageTitle = "新增模板";
        break;
      case "edit":
        this.pageTitle = "编辑模板";
        this.nameModelOpts.standalone = true;
        break;
      case "detail":
        this.pageTitle = "模板详情";
        break;
      default:
        break;
    }
  }

  // ============================= START 插入变量 ============================= //

  // 插入变量
  insertVar(e) {
    // 变量超出文本长度的提示
    if (typeof this.editRecord.content === "string" && !this.canInsertContent(this.editRecord.content, "${" + e.code + "}", this.maxLength)) {
      this.dialogService.notification.error("提示", "内容插入该变量之后，将会超出最大长度限制");
      return;
    }
    this.editRecord.vIndex = typeof this.editRecord.vIndex == "number" ? this.editRecord.vIndex : 0;
    let aPart = (this.editRecord.content || "").slice(0, this.editRecord.vIndex);
    let bPart = (this.editRecord.content || "").slice(this.editRecord.vIndex);
    this.editRecord.content = aPart + "${" + e.code + "}" + bPart;
    this.editRecord.vIndex += e.code.length + 3;
  }

  // 移除变量
  removeVar(e) {
    if (!this.variableInvokedByTemplates(e)) {
      this.libraryVar.removeVariable(e);
    } else {
      this.dialogService.notification.error(this.subject, `所选变量【${e.name}】已被模板引用，不可进行移除。`);
      return;
    }
  }

  // 校验变量是否被模板引用
  variableInvokedByTemplates(variable) {
    let _content = "";
    if (typeof this.editRecord?.content === "string") {
      _content = this.editRecord?.content;
    }
    return !!(_content.indexOf("${" + variable.code + "}") > -1);
  }

  // ============================= END 插入变量 ============================= //

  /**
   * 短链配置弹窗
   * @param template
   * @returns
   */
  OpenShortChainModal() {
    // 添加校验：若模板中已含有贴片，且贴片含有链接，则不允许插入短链
    if (
      this.editRecord.content?.includes("${短链接}") ||
      (Array.isArray(this.editRecord?.patchStrategy) &&
        this.editRecord.patchStrategy.length > 0 &&
        this.editRecord.patchStrategy.some(item => item.requireShortUrl))
    ) {
      this.dialogService.notification.error(this.subject, "已存在短链,请擦除后再插入。");
      return;
    }
    if (!this.canInsertContent(this.editRecord.content, "${短链接}", this.maxLength)) {
      this.dialogService.notification.error("提示", "短信内容插入短链接之后，将会超出最大长度限制");
      return;
    }
    this.modal.createStatic(IccShortChainConfigComponent, { template: this.editRecord }, { size: "md" }).subscribe(result => {
      const { longUrlName, longUrl, serverUrl, traceType, targetUrlId } = result;
      this.editRecord.requireShortUrl = true;
      this.editRecord.longUrlName = longUrlName;
      this.editRecord.longUrl = longUrl;
      this.editRecord.serverUrl = serverUrl;
      this.editRecord.targetUrlId = targetUrlId;
      this.editRecord.traceType = traceType;
    });
  }

  canInsertContent(content: string = "", insert: string = "", maxLen: number): boolean {
    return (isNaN(content?.length) ? 0 : content.length) + insert.length <= maxLen;
  }

  /**
   * 贴片选择弹窗
   * @param contentType
   * @returns
   */
  openPatchModal() {
    if (Array.isArray(this.editRecord.patchStrategy) && this.editRecord.patchStrategy.length >= 3) {
      this.dialogService.notification.warning("提示", `最多只能添加三个贴片`);
      return false;
    }
    // 贴片中是否含有短链
    if (Array.isArray(this.editRecord.patchStrategy) && this.editRecord.patchStrategy.length > 0) {
      this.hasShortUrl = this.editRecord.patchStrategy.some(item => item.requireShortUrl);
    }
    // 模板是否插入短链
    this.hasShortUrl = this.hasShortUrl || !!this.editRecord.requireShortUrl;
    this.modal
      .create(
        IccPatchDialogComponent,
        {
          msgType: this.editRecord.msgType,
          contentType: MSG_CONTENT_TYPE.TEXT,
          groupUrl: URLS.templatePatchGroup.url,
          itemUrl: URLS.templatePatchGroupItem.url,
          content: this.editRecord.content,
          // 1. 模板是否已插入短链 2. 模板所包含的贴片是否已有短链
          hasShortUrl: this.hasShortUrl,
        },
        { size: "lg" },
      )
      .subscribe(result => {
        if (!this.canInsertContent(this.editRecord.content, "${" + result.groupName + "}", this.maxLength)) {
          this.dialogService.notification.error("贴片添加失败", "短信内容插入贴片之后，将会超出最大长度限制");
          return;
        }
        this.editRecord.patchStrategy = this.editRecord.patchStrategy ? [...this.editRecord.patchStrategy, result] : [result];
      });
  }

  /**
   * 监听 fake-textarea 输入事件监听
   */
  handelValueChange($event) {
    const { patchStrategy } = this.editRecord;
    // template中的value 与 faketextarea中的value同步
    this.editRecord.content = $event;
    // 根据 content中的值，动态删除多余的 pasters
    if (patchStrategy) {
      this.editRecord.patchStrategy = patchStrategy.filter(v => {
        return this.editRecord.content?.indexOf("${" + v.groupName + "}") > -1;
      });
    }
    // 监听短链是否存在 决定是否置空 targetUrl
    if (!this.editRecord.content?.includes("${短链接}")) {
      this.editRecord.longUrlName = "";
      this.editRecord.longUrl = "";
      this.editRecord.serverUrl = "";
      this.editRecord.traceType = "";
      this.editRecord.requireShortUrl = false;
      this.hasShortUrl = false;
    }
    this.isFireChange = true;
    this.validChars = !invalidSendContent(this.editRecord.content);
    this.cdr.detectChanges();
  }

  calcSegments(value) {
    let length = value.length || 0;
    if (length <= 70) {
      return 1;
    } else {
      return Math.ceil(length / 67);
    }
  }
}
