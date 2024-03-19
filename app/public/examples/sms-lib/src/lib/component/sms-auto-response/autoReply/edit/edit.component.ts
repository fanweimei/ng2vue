import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { NzTreeComponent, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { NzTreeBase } from "ng-zorro-antd/core/tree";
import { NzModalRef } from "ng-zorro-antd/modal";
import { UntypedFormGroup } from "@angular/forms";
import { DialogService } from "@icc/common-lib";
import { URLS } from "../../../../shared/constant/interface";
import { throttle } from "@icc/common-lib";
import { NzTreeSelectComponent } from "ng-zorro-antd/tree-select";
@Component({
  selector: "app-edit",
  templateUrl: "./edit.component.html",
  styles: [
    `
      .len-tip {
        line-height: 1.4;
        text-align: right;
        font-size: 12px;
        color: #969595;
      }
    `,
  ],
})
export class SmsAutoReplyEditorComponent implements OnInit, OnDestroy {
  constructor(public http: _HttpClient, private dialogService: DialogService, private modal: NzModalRef) {}

  @ViewChild("f", { static: false }) f: UntypedFormGroup;
  oldUserId = 0;
  oldRecordId = 0;
  autoReply: any = {
    id: "",
    channelId: 0, //渠道id，加黑默认为0
    ruleName: "", //规则名称，加黑默认为空
    type: 1, // 页面类型 1： 回复， 2：加黑， 3：上报
    userId: 0, //用来匹配的用户id，全局为0
    state: 1, //状态
    remove: 0, //是否删除
    eventType: 1, // 触发的事件类型 1：收到上行信息， 2： 新用户关注
    autoMatchExtConfigs: [
      {
        msgType: 0, //消息类型，加黑默认短信
        content: "", //关键字内容
        matchMode: 1, //匹配模式 （匹配模式，1:半匹配，2，全匹配）
      },
    ],
    autoRespConfigs: [
      {
        respType: 1, // 响应类型， 1：回复， 2：加黑， 3：上报
        targetId: 0, //用户id
        targetType: 0, //0 全局黑名单 1用户黑名单
        respMode: 0, // 回复模式， 0： 任意一条， 1：全部
        targetParams: "", //扩展参数
        autoRespParams: [
          {
            paramType: 0, //消息类型
            content: "", //消息内容
          },
        ],
      },
    ],
  };

  // 是否显示关联账号
  isRelevance: string = "a";

  record: any;
  keyword: any = "";
  content: any = "";

  nparam = {
    id: this.autoReply.id,
    keyword: this.autoReply.keyword,
    url: URLS.smsAutoReplyKeywordExist.url + "/0/0/0",
  };

  linkedAccounts: any[] = [];
  operation = "新增";
  subject = "自动回复";
  keywordBeforeChange = "0";
  account: any = "-1";
  userId: any = 0;
  validate: any = this.keyword;
  required: any;
  duplicated: any;
  emptyStr: any;
  throttleFn: any;
  validateFlag: any;
  /* 回复内容最大字符数982 */
  maxlength: number = 982;

  @ViewChild("nzTreeComponent", { static: false })
  nzTreeComponent: NzTreeSelectComponent;
  nodes: NzTreeNodeOptions[] = [];
  defaultExpandedKeys = []; // 默认展开根节点

  ngOnInit() {
    if (this.record && this.record.id > 0) {
      this.oldUserId = this.record.userId;
      this.oldRecordId = this.record.id;
      this.operation = "编辑";

      // fix: 请求之后改变isRelevance，会影响用户体验，且此处不应该请求详情接口，修改：
      this.autoReply = this.record;
      this.isRelevance = this.autoReply.userId == 0 ? "b" : "a";
      this.userId = this.autoReply.userId;
      this.keyword = this.autoReply.autoMatchExtConfigs[0].content;
      this.content = this.autoReply.autoRespConfigs[0].autoRespParams[0].content;
      this.nparam.url = URLS.smsAutoReplyKeywordExist.url + "/" + this.autoReply.keywordType + "/0" + "/" + this.record.id;
      this.getLinkedAccounts();
      this.checkPageKeyword();

      // this.http.get(URLS.smsAutoReplyDetail.url + "/" + this.record.id).subscribe(res => {
      //   if (res.status === 0) {
      //     this.autoReply.userId = res.data.userId;
      //     if (this.autoReply.userId == 0) {
      //       this.isRelevance = "b";
      //     } else {
      //       this.isRelevance = "a";
      //     }
      //     this.userId = res.data.userId;
      //     this.autoReply = res.data;
      //     this.autoReply.userId = res.data.userId;
      //     this.keyword = res.data.autoMatchExtConfigs[0].content;
      //     this.content = res.data.autoRespConfigs[0].autoRespParams[0].content;
      //     this.nparam.url = URLS.smsAutoReplyKeywordExist.url + "/" + this.autoReply.keywordType + "/0" + "/" + this.record.id;
      //     this.getLinkedAccounts();
      //     // 编辑初始化时，校验一次关键字，便于直接保存
      //     this.checkPageKeyword();
      //   } else {
      //     this.dialogService.notification.error(`${this.operation}${this.subject}`, `${res.errorMsg}`);
      //   }
      // });
    } else {
      this.getLinkedAccounts();
    }

    // 节流
    this.throttleFn = throttle(this.checkPageKeyword, 100);
    document.addEventListener("scroll", this.throttleFn);
  }

  ngOnDestroy(): void {
    document.removeEventListener("scroll", this.throttleFn);
  }

  getLinkedAccounts(selectKey?) {
    this.http.get(URLS.smsAutoReplyGetAccounts.url + "/0/false/" + encodeURIComponent(this.account) + "/" + this.userId).subscribe(res => {
      if (res.status === 0 && res.data && res.data.length > 0) {
        this.linkedAccounts = res.data;
      }
    });
  }

  recursionExpand(selectKey, expandedKeys: any[], treeComponent: NzTreeBase) {
    expandedKeys.push(selectKey);
    const tmpNode = treeComponent.getTreeNodeByKey(selectKey);
    if (tmpNode) {
      if (tmpNode.parentNode) {
        this.recursionExpand(tmpNode.parentNode.key, expandedKeys, treeComponent);
      }
    }
  }

  keywordTypeChange(event) {
    if (event !== this.keywordBeforeChange) {
      this.isRelevance = event;
    }
    if (event == "b") {
      this.autoReply.userId = 0;
    } else {
      this.autoReply.userId = this.oldUserId;
    }
    this.keywordBeforeChange = event;
    this.record && this.record.id > 0 && event == "a"
      ? (this.nparam.url = URLS.smsAutoReplyKeywordExist.url + "/" + this.autoReply.userId + "/0" + "/" + this.record.id)
      : (this.nparam.url = URLS.smsAutoReplyKeywordExist.url + "/" + this.autoReply.userId + "/0/0");

    // 切换类型后，校验一下当前关键字类型的唯一性
    if (this.keyword && this.keyword !== "") {
      let name = encodeURIComponent(this.keyword);
      this.http.get(this.nparam.url + "?name=" + name).subscribe(res => {
        if (res.status === 0) {
          if (res.data) {
            this.validate = "error";
            this.duplicated = true;
            this.validateFlag = undefined;
          } else {
            this.validate = undefined;
            this.duplicated = undefined;
            this.validateFlag = true;
          }
        }
      });
    }
  }

  // userIdChange
  userIdChange($event) {
    this.oldUserId = $event;
    this.checkPageKeyword();
  }

  // 界面检查
  checkPageKeyword() {
    // 先校验页面输入数据
    if (this.keyword && this.keyword.trim() !== "") {
      this.validate = "success";
      // 改变远程校验请求参数
      this.nparam.url = URLS.smsAutoReplyKeywordExist.url + "/" + this.autoReply.userId + "/0/" + this.record.id;
      // 重置状态
      this.required = undefined;
      // this.emptyStr = undefined;
      this.duplicated = undefined;
      this.validate = this.keyword;
      // 检查远程校验结果
      let name = encodeURIComponent(this.keyword);
      this.http.get(this.nparam.url + `?name=` + name).subscribe(res => {
        if (res.status === 0) {
          if (res.data) {
            // 防止后台校验覆盖掉前端必填的校验
            if (this.keyword && this.keyword !== "") {
              this.validate = "error";
              this.duplicated = true;
              this.required = undefined;
              this.validateFlag = undefined;
            }
          } else {
            // 通过远程校验
            if (!this.keyword || this.keyword === "") {
              this.validate = "error";
              this.required = true;
              this.duplicated = undefined;
              this.validateFlag = undefined;
            } else {
              this.validate = "success";
              this.duplicated = undefined;
              this.required = undefined;
              this.validateFlag = true;
            }
          }
        } else {
          this.dialogService.notification.error("关键字校验", "关键字远程唯一性校验失败");
        }
      });
    } else {
      this.validate = "error";
      this.required = true;
    }
  }

  onblur() {
    if (!this.keyword || this.keyword === "") {
      this.validate = "error";
      this.required = true;
      this.duplicated = undefined;
      this.validateFlag = undefined;
    }
    if (this.required) {
      return;
    }
    this.checkPageKeyword();
  }

  save() {
    this.autoReply.autoMatchExtConfigs[0].content = this.keyword;
    let temp: any[] = [];
    let content = { paramType: 1, content: this.content };
    temp.push(content);
    this.autoReply.autoRespConfigs[0].autoRespParams = temp;

    // 全局关键字则账号为0
    if (this.autoReply.userId === 0) {
      this.autoReply.autoRespConfigs[0].targetId = 0;
      this.autoReply.autoRespConfigs[0].targetType = 0;
    } else {
      this.autoReply.autoRespConfigs[0].targetId = this.autoReply.userId;
      this.autoReply.autoRespConfigs[0].targetType = 1;
    }

    let url = URLS.smsAutoReplyAdd.url;
    if (this.record && this.record.id > 0) {
      url = URLS.smsAutoReplyEdit.url;
    }

    this.http.post(url, this.autoReply).subscribe(res => {
      if (res.status === 0) {
        this.dialogService.notification.success(`${this.operation}${this.subject}`, `${this.operation}成功`);
        this.modal.close(true);
      } else {
        if (res.status == -99 && res.data && res.data.data.length) {
          res.errorMsg = `回复内容包含敏感字！包含敏感字${(res.data.data[0].contents.length > 20
            ? res.data.data[0].contents.slice(0, 20) + "..."
            : res.data.data[0].contents
          )
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;")}，请修改！`;
        }
        this.dialogService.notification.error(`${this.operation}${this.subject}`, `${res.errorMsg}`);
      }
    });
  }

  searchAccount(event) {
    !event || event.trim() === "" ? (this.account = "-1") : (this.account = event);
    this.getLinkedAccounts();
  }

  close() {
    this.modal.close();
  }
}
