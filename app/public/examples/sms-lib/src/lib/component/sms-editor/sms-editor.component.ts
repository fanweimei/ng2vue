import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MSG_APPTYEP, MSG_CONTENT_TYPE, MSG_TYPE } from "../../shared/constant/msgType";
import { ModalHelper } from "@delon/theme";
import { URLS } from "../../shared/constant/interface";
import { SmsTplAutoMatchComponent } from "../sms-tpl-auto-match/sms-tpl-auto-match.component";
import { _HttpClient } from "@delon/theme";
import { DialogService, invalidSendContent, MsgEditor, EventService, URLS as API } from "@icc/common-lib";
import { EleAimLinkComponent } from "./ele/ele-aim-link/ele-aim-link.component";
import { ItemConfig, MsgFormComponent, flatValue } from "@icc/share/msg-form";

@Component({
  selector: "icc-sms-editor",
  templateUrl: "./sms-editor.component.html",
  styles: [],
})
export class SmsEditorComponent implements OnInit, MsgEditor, AfterViewInit {
  constructor(private dialogService: DialogService, public http: _HttpClient, private modal: ModalHelper, private eventService: EventService) {}

  @ViewChild(MsgFormComponent) msgformComp: MsgFormComponent;
  @ViewChild("msgtplcomp", { static: false })
  msgTplComp: SmsTplAutoMatchComponent;
  static SCENE = "icc-msg-editor";
  type = MSG_TYPE;

  // AppPush通知栏消息标识符
  SMS_COMMON_TYPE = MSG_APPTYEP.common;
  // AppPush透传消息标识符
  SMS_AIM_TYPE = MSG_APPTYEP.aim;
  // 判断是否是M消息
  isAim: boolean = false;
  // M 消息模板是否过期
  aimTplExpire: boolean = false;
  // M 消息链接是否过期
  aimLinkExpire: boolean = false;

  // 模板/贴片中是否含有短链
  hasShortUrl: boolean;

  // 是否自动匹配
  isAutoMath: boolean;
  // 自动匹配列表数据
  tplList: Array<any>;
  // 短信账号签名
  signature;
  // 短信初始配置
  options: ItemConfig[] = [
    {
      formControlName: "content",
      component: "cxtextarea",
      required: true,
      args: {
        placeholder: "请输入短信内容",
        hasSignature: true,
        maxLength: 982,
        targetUrl: "",
        shortUrlInfo: {},
        isHasPaster: true, // 贴片
        patchInfos: [], // 贴片事件
        isHasShortLink: true, // 短链
        shortLink: {
          // 短链数据
          requireShortUrl: false,
          longUrlName: "",
          longUrl: "",
          serverUrl: "",
          traceType: 1,
        },
        extraTag: {
          list: [],
          nzMode: "default",
          isHasSegment: true,
          segments: 0,
          currVarName: "",
        },
        tips: ["短信内容默认携带当前登录账号的账号签名下发，实际收信签名以下发结果为准（运营商通道如果存在通道签名，则消息内容携带通道签名，而非账号签名）"],
        msgType: MSG_TYPE,
      },
    },
  ];

  // M消息配置
  options2 = [
    {
      label: "短信签名",
      formControlName: "signature",
      component: "text",
      defautValue: "【】",
    },
    {
      label: "M消息模板名称",
      formControlName: "tplName",
      component: "asyncselect",
      required: true,
      args: {
        placeholder: "基于模板名称选择，显示M消息模板内容",
        url: API.aimTemplateList.url,
        index: "tplName",
        extraParams: (params: any) => {
          return {
            ...params,
            tplId: "",
            aimAccountName: "",
            templateType: -1,
            factorys: [],
            auditStatus: -1,
            status: -1,
            updateUser: "",
            start: null,
            end: null,
          };
        },
        labelKey: "tplName",
        valueKey: "tplId",
      },
      rely: {
        name: "tplId",
        action: "eq",
      },
    },
    {
      label: "M消息模板ID",
      formControlName: "tplId",
      component: "asyncselect",
      required: true,
      args: {
        placeholder: "基于模板ID选择，显示M消息模板内容",
        url: API.aimTemplateList.url,
        index: "tplId",
        extraParams: (params: any) => {
          return {
            ...params,
            tplName: "",
            aimAccountName: "",
            templateType: -1,
            factorys: [],
            auditStatus: -1,
            status: -1,
            updateUser: "",
            start: null,
            end: null,
          };
        },
        labelKey: "tplId",
        valueKey: "tplId",
      },
      rely: {
        name: "tplName",
        action: "eq",
      },
    },
    {
      label: "M消息链接",
      formControlName: "aimUrl",
      component: EleAimLinkComponent,
      required: true,
      args: {
        placeholder: "请选择M消息链接",
        aimLinkStatus: false,
        jobId: 0,
        jobName: "",
        jobCode: "",
        tplId: "",
        linkType: "",
      },
      rely: [
        {
          name: "tplName",
          action: "onTemplateChange",
        },
        {
          name: "tplId",
          action: "onTemplateChange",
        },
      ],
    },
    {
      label: "短信原文",
      formControlName: "content",
      component: "cxtextarea",
      required: true,
      args: {
        placeholder: "请输入短信内容",
        hasSignature: false,
        maxLength: 982,
        targetUrl: "",
        shortUrlInfo: {},
        isHasPaster: true, // 贴片
        patchInfos: [], // 贴片事件
        isHasShortLink: true, // 短链
        shortLink: {
          // 短链数据
          requireShortUrl: false,
          longUrlName: "",
          longUrl: "",
          serverUrl: "",
          traceType: 1,
        },
        extraTag: {
          list: [],
          nzMode: "default",
          isHasSegment: true,
          segments: 0,
          hasSignature: true,
        },
        tips: ["M消息解析失败时，终端展示为短信签名+短信原文+M消息链接"],
        msgType: MSG_TYPE,
      },
    },
  ];
  disabled = false;

  // 【选择模板】模板id
  templateId: string;

  uuid: string = "";

  get tplId() {
    return this.msgformComp?.form.get("tplId")?.value;
  }

  ngOnInit() {
    this.getUserSignature();
  }

  ngAfterViewInit(): void {}

  getUserSignature() {
    this.http.post(URLS.getUserSignature.url).subscribe(res => {
      if (res.status === 0) {
        this.signature = res.data;
        if (this.isAim) {
          // 如果是M消息，签名作为一个单独表单项
          this.msgformComp.setValue({ signature: `【${this.signature || ""}】` });
        }
      } else {
        this.dialogService.notification.error("获取账号签名", res.errorMsg);
      }
    });
  }
  /* 设置禁用状态 */
  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }
  /* 数据重置 */
  resetData() {
    this.aimTplExpire = false;
    this.msgformComp.reset();
    this.templateId = "";
    if (this.isAim) {
      // 如果是M消息，签名作为一个单独表单项
      this.msgformComp.setValue({ signature: `【${this.signature || ""}】` });
    }
    this.cancelAutoMathTpl();
  }

  /* 数据校验 */
  validate(): boolean {
    if (this.aimTplExpire) {
      this.eventService.change("invalid-material", "M消息选择的M消息模板已停用，终端解析可能失败，是否继续？");
      return false;
    }
    // Fix: 先进行表单校验，避免在自动匹配模板/选择模板后跳过了链接过期的校验
    if (!this.msgformComp.validate()) {
      return false;
    }
    if (this.isAutoMath || this.templateId) {
      return true;
    }
    if (invalidSendContent(this.msgformComp.form.value.content)) {
      this.dialogService.notification.warning("提示", "短信内容包含了无效字符，'${'和'}'必须成对出现且不能嵌套");
      return false;
    }

    return true;
  }

  /* 选择模板数据设置 */
  setSelectedTplData(tplData: any) {
    if (!tplData) return;
    const textAreaConfig: any = this.options.find(item => item.formControlName == "content");
    let params: any = {},
      args: any = {};
    params[textAreaConfig.formControlName] = tplData.content;
    this.templateId = tplData.templateId;
    let segments;
    let length = tplData.content.length + 2 + (this.signature ? this.signature.length : 0);
    if (length <= 70) {
      segments = 1;
    } else {
      segments = Math.ceil(length / 67);
    }
    args[textAreaConfig.formControlName] = {
      patchInfos: tplData.patchInfos,
      serverUrl: tplData.serverUrl,
      extraTag: {
        segments,
        isHasSegment: true,
      },
    };
    if (tplData.applyId === MSG_APPTYEP.aim) {
      params.tplId = tplData.varMap.aimTplId;
      params.tplName = tplData.varMap.aimTplId;
      params.aimUrl = tplData.varMap.aimUrl;
      this.aimTplExpire = tplData.expire;
      let aimUrlConfig: any = this.options.find(item => item.component == EleAimLinkComponent);
      args[aimUrlConfig.formControlName] = {
        jobId: tplData.varMap.aimJobId,
        jobCode: tplData.varMap.jobCode,
        linkType: tplData.varMap.aimLinkType,
      };
    }
    this.msgformComp.setValue(params);
    this.msgformComp.updateArgs(args);
  }

  /* 自动匹配模板设置 */
  setAutoMathTpl(tplList: Array<any>): void {
    this.isAutoMath = true;
    this.tplList = tplList;
  }
  /* 自动匹配模板取消 */
  cancelAutoMathTpl(): void {
    this.isAutoMath = false;
    this.tplList = [];
  }

  /* 获取数据 */
  getMessageData() {
    if (this.templateId) {
      return {
        msgType: this.type,
        templateId: this.templateId,
      };
    }
    let value = flatValue(this.msgformComp.getValue());
    console.log("sms:", value);
    let data: any = {
      msgType: this.type,
      aimLinkInfo: value.aimLinkInfo,
      content: value.content,
      patchInfos: value.patchInfos,
      shortUrlInfo: value.shortUrlInfo,
    };
    if (this.isAim) {
      data.aimLinkInfo = value.aimLinkInfo;
    }
    return data;
  }

  /* 获取移动端预览数据 */
  getMobilePreviewData() {
    const previewData: any = {
      isAim: this.isAim,
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
    if (this.isAutoMath) {
      if (this.msgTplComp.viewList && this.msgTplComp.viewList.length > 0) {
        content = this.msgTplComp.viewList[0].content;
        if (this.isAim) {
          content = this.msgTplComp.viewList[0]?.varMap?.aimTplId;
        }
      } else {
        content = "";
      }
    } else {
      const data: any = flatValue(this.msgformComp.getValue());
      console.log("sms:", data);
      content = this.isAim ? data.tplId : (content = data.content);
    }
    previewData.infos.push({
      content,
    });
    return previewData;
  }
  /* 设置业务变量标签 */
  setBizVarTags(varTags) {
    if (this.isAutoMath) return true;
    const textAreaConfig: any = this.options.find(item => item.formControlName == "content");
    textAreaConfig.args.extraTag.list = varTags;
  }

  /** 更改配置 */
  changeOptions() {
    if (this.isAim) {
      this.options = this.options2;
    }
  }

  // ====================== M 消息相关 =========================
  // 判断是普通短信还是M消息
  getMsgApplicationType(applicationTypes) {
    this.isAim = applicationTypes.includes(this.SMS_AIM_TYPE);
    return this.isAim;
  }

  /* 是否包含状态为已停用的模板 */
  hasInvalidTemplate(): boolean {
    return false;
  }
}
