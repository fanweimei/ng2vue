import { Component, OnInit, ViewChild } from "@angular/core";
import { _HttpClient } from "@delon/theme";
import { NzTreeComponent, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { NzTreeBase } from "ng-zorro-antd/core/tree";
import { NzModalRef } from "ng-zorro-antd/modal";
import { throttle, MessageService, DialogService } from "@icc/common-lib";
import { deepCopy } from "@delon/util";
import { URLS } from "../../../shared/constant/interface";

@Component({
  selector: "app-edit",
  templateUrl: "./edit.component.html",
  styles: [],
})
export class AutoBlackListEditComponent implements OnInit {
  static NAME = "icc-msg-auto-black-edit";
  constructor(private messageService: MessageService, public http: _HttpClient, private dialogService: DialogService, private modal: NzModalRef) {}
  saveLoading: boolean = false;
  oldUserId = 0;
  oldChannelId = 0;
  oldBizTypeId = 0;
  channelIdKey = -1;
  targetTypeKey = -1;
  userIdKey = 0;
  bizTypeKey = -1;
  autoBlackList: any = {
    id: "",
    channelId: 0, // 渠道id，加黑默认为0
    bizTypeId: 0, //业务模板id
    ruleName: "", // 规则名称，加黑默认为空
    type: 2, // 页面类型 1： 回复， 2：加黑， 3：上报
    userId: -1, // 用来匹配的用户id，全局为0
    state: 1, // 状态
    remove: 0, // 是否删除
    eventType: 1, // 触发的事件类型 1：收到上行信息， 2： 新用户关注
    autoMatchExtConfigs: [
      {
        msgType: 0, // 消息类型，加黑默认短信
        content: "", // 关键字内容
        matchMode: 2, // 匹配模式 （匹配模式，1:半匹配，2，全匹配）
      },
    ],
    autoRespConfigs: [
      {
        respType: 1, // 响应类型， 1：回复， 2：加黑， 3：上报
        targetId: 0, // 用户id
        targetType: 0, // 0 全局黑名单 1用户黑名单
        respMode: 0, // 回复模式， 0： 任意一条， 1：全部
        targetParams: "", // 扩展参数
        autoRespParams: [
          {
            paramType: 0, // 消息类型
            content: "", // 消息内容
          },
        ],
      },
      {
        respType: 2, // 响应类型， 1：回复， 2：加黑， 3：上报
        targetId: 0, // 用户id
        targetType: 0, // 0 全局黑名单 1用户黑名单
        respMode: 0, // 回复模式， 0： 任意一条， 1：全部
        targetParams: "", // 扩展参数
      },
    ],
    msgTypes: [0],
  };
  // 是否显示关联账号
  isRelevance: string;

  record: any;
  keyword: any = "";
  content: any = "";

  keywordOld: any = "";

  userList: any[];

  isEdit = false;

  account: any = "-1";
  bizType: any = "-1";
  channel: any = "-1";
  userId: any = -1;

  validate: any = this.keyword;
  required: any;
  duplicated: any;
  throttleFn: any;
  msgType = this.messageService.getMsgTypeByName("sms", true);

  nparam = {
    id: this.autoBlackList.id,
    keyword: this.autoBlackList.autoMatchExtConfigs[0].content,
    url: URLS.smsAutoBlackListKeywordExist.url + "/0/0/0/0/-1",
  };

  linkedAccounts: any[] = [];
  linkedBizTypes: any[] = [];
  linkedChannels: any[] = [];

  selectMsgTypes: any = [];

  operation = "新增";
  subject = "自动加黑";
  keywordBeforeChange = "0";

  @ViewChild("nzTreeComponent", { static: false })
  nzTreeComponent: NzTreeComponent;
  nodes: NzTreeNodeOptions[] = [];
  defaultExpandedKeys = []; // 默认展开根节点

  isKeyWordNotExist = true;

  ngOnInit() {
    this.initMsgType(() => {
      if (this.record && this.record.id > 0) {
        this.oldUserId = this.record.userId;
        this.oldChannelId = this.record.channelId;
        this.oldBizTypeId = this.record.bizTypeId;
        this.isEdit = true;
        this.operation = "编辑";
        this.http.get(URLS.smsAutoBlackListDetail.url + "/" + this.record.id).subscribe(res => {
          if (res.status === 0) {
            this.autoBlackList = res.data;

            this.userId = res.data.userId;
            this.autoBlackList.userId = res.data.userId;
            this.userIdKey = this.autoBlackList.userId;
            this.keyword = res.data.autoMatchExtConfigs[0].content;
            this.keywordOld = res.data.autoMatchExtConfigs[0].content;

            let autoRespConfigsInfo;
            // this.content = res.data.autoRespConfigs[0].autoRespParams.length ? res.data.autoRespConfigs[0].autoRespParams[0].content : '';
            res.data.autoRespConfigs.forEach(item => {
              if (item && item.respType === 2) {
                this.targetTypeKey = item.targetType;
                autoRespConfigsInfo = item;
              } else if (item.respType == 1) {
                this.content = item.autoRespParams && item.autoRespParams[0] && item.autoRespParams[0].content ? item.autoRespParams[0].content : "";
              }
            });

            if (autoRespConfigsInfo.targetType === 0) {
              this.isRelevance = "a";
              this.getUsers();
            } else if (autoRespConfigsInfo.targetType === 1) {
              this.isRelevance = "b";
            } else if (autoRespConfigsInfo.targetType === 2) {
              this.isRelevance = "c";
              this.getBizTypes();
              this.autoBlackList.bizTypeId = res.data.bizTypeId;
              this.bizTypeKey = this.autoBlackList.bizTypeId;
            } else if (autoRespConfigsInfo.targetType === 3) {
              this.channelIdKey = autoRespConfigsInfo.targetId;
              this.isRelevance = "d";
              this.getChannel();
              this.autoBlackList.channelId = res.data.channelId;
            }
            this.nparam.url =
              URLS.smsAutoBlackListKeywordExist.url +
              "/" +
              this.channelIdKey +
              "/" +
              this.targetTypeKey +
              "/" +
              this.userIdKey +
              "/" +
              this.autoBlackList.id +
              "/" +
              this.autoBlackList.bizTypeId;
          } else {
            this.dialogService.notification.error(`${this.operation}${this.subject}`, `${res.errorMsg}`);
          }
        });

        this.autoBlackList.userId = this.userId;
        this.userIdKey = this.autoBlackList.userId;
      } else {
        // 获取下拉账号
        this.targetTypeKey = 2;
        this.getUsers();
      }
    });

    // 节流
    this.throttleFn = throttle(this.checkPageKeyword, 100);
    document.addEventListener("scroll", this.throttleFn);
  }

  getUsers() {
    const urlSel = URLS.smsAutoBlackListGetAccounts.url + "/0" + "/" + this.account + "/" + this.userId;
    this.http.get(urlSel).subscribe(res => {
      if (res.status === 0 && res.data && res.data.length > 0) {
        // 2020-05-06 需求变更，下拉样式不需要树结构
        this.linkedAccounts = res.data;
      }
    });
  }

  getChannel() {
    const urlSel = URLS.smsAutoBlackListGetChannels.url + "/" + this.msgType + "/" + this.channel + "/1";
    this.http.get(urlSel).subscribe(res => {
      if (res.status === 0 && res.data && res.data.length > 0) {
        this.linkedChannels = res.data;
      }
    });
  }

  getBizTypes(val?) {
    const urlSel = URLS.smsAutoBlackListGetBizTypes.url + "/" + this.msgType + "/" + (this.record && this.record.id > 0 ? -1 : 1);
    this.http.get(urlSel).subscribe(res => {
      if (res.status === 0 && res.data && res.data.length > 0) {
        // this.linkedBizTypes = res.data;
        if (val) {
          let temp: any[] = [];
          res.data.forEach(element => {
            if (element.name.indexOf(val) > -1) {
              temp.push(element);
            }
          });
          this.linkedBizTypes = temp;
        } else {
          this.linkedBizTypes = res.data;
        }
      }
    });
  }

  initMsgType(callback) {
    this.http.get(URLS.msgTypes.url).subscribe(res => {
      if (res.status === 0) {
        let temp: any[] = [];
        res.data.forEach(msgType => {
          // 屏蔽抖音和极光、企业微信、5G、语音通知
          // if (msgType.index !== 3 && msgType.index !== 6 && msgType.index !== 7 && msgType.index !== 8 && msgType.index !== 9) {
          let MSGTYPES = this.messageService.getMsgCollection();
          for (let key in MSGTYPES) {
            if (MSGTYPES[key].type === msgType.index && MSGTYPES[key].autoReport === 1) {
              msgType.checked = false;
              msgType.isDisabled = true;
              temp.push(msgType);
            }
          }
        });
        // 当剩下一条消息类型时，不显示全消息类型
        if (temp.length > 1) {
          const all = {
            value: "-1",
            index: -1,
            label: "全消息类型",
            sequence: -1,
            checked: true,
            isDisabled: false,
          };
          temp.unshift(all);
        }
        this.selectMsgTypes = temp;
      }
      callback();
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

  keywordChange(event) {
    this.duplicated = undefined;
    if (this.keyword && this.keyword.trim()) {
      this.validate = "success";
    } else {
      this.validate = "error";
      this.required = true;
    }
    if (event !== this.keywordBeforeChange) {
      /*
      this.keyword = '';
      this.content = ''; */
      this.isRelevance = event;
    }

    this.autoBlackList.userId = -1;
    this.userIdKey = this.autoBlackList.userId;
    if (event == "a") {
      this.getUsers();
      this.autoBlackList.userId = this.oldUserId;
      this.userIdKey = this.autoBlackList.userId;
      this.targetTypeKey = 0;
      this.channelIdKey = -1;
      this.bizTypeKey = -1;
    } else if (event == "c") {
      this.getBizTypes();
      this.autoBlackList.bizTypeId = this.oldBizTypeId;
      this.targetTypeKey = 2;
      this.bizTypeKey = this.autoBlackList.bizTypeId;
      this.channelIdKey = -1;
    } else if (event == "d") {
      this.getChannel();
      this.autoBlackList.channelId = this.oldChannelId;
      this.targetTypeKey = 3;
      this.channelIdKey = this.autoBlackList.channelId;
      this.bizTypeKey = -1;
    } else {
      this.targetTypeKey = 1;
      this.channelIdKey = -1;
      this.bizTypeKey = -1;
    }
    this.keywordBeforeChange = event;
    if (!this.checkIsNoSelect()) {
      return;
    }
    let urlParams = this.channelIdKey + "/" + this.targetTypeKey + "/" + this.userIdKey;
    this.record && this.record.id > 0
      ? (this.nparam.url = URLS.smsAutoBlackListKeywordExist.url + "/" + urlParams + "/" + this.record.id + "/" + this.bizTypeKey)
      : (this.nparam.url = URLS.smsAutoBlackListKeywordExist.url + "/" + urlParams + "/0" + "/" + this.bizTypeKey);
    // 切换类型后，校验一下当前关键字类型的唯一性
    if (this.keyword && this.keyword.trim() !== "") {
      let name = encodeURIComponent(this.keyword);
      this.http.get(this.nparam.url + "?name=" + name).subscribe(res => {
        if (res.status === 0) {
          if (res.data) {
            // 防止后台校验覆盖掉前端必填的校验
            if (this.keyword && this.keyword !== "") {
              this.validate = "error";
              this.duplicated = true;
              this.required = undefined;
              this.isKeyWordNotExist = false;
            }
          } else {
            // 通过远程校验
            if (!this.keyword || this.keyword === "") {
              this.validate = "error";
              this.required = true;
              this.duplicated = undefined;
            } else {
              this.validate = "success";
              this.duplicated = undefined;
              this.required = undefined;
            }
            this.isKeyWordNotExist = true;
          }
        }
      });
    }
  }
  // userIdChange
  userIdChange($event) {
    this.oldUserId = $event;
    this.targetTypeKey = 0;
    this.userIdKey = this.oldUserId;
    if (this.keyword && this.keyword.trim() !== "") {
      this.checkPageKeyword($event);
    }
  }
  channelIdChange($event) {
    this.oldChannelId = $event;
    this.targetTypeKey = 3;
    this.channelIdKey = this.oldChannelId;
    if (this.keyword && this.keyword.trim() !== "") {
      this.checkPageKeyword($event);
    }
  }
  bizTypeIdChange($event) {
    this.oldBizTypeId = $event;
    this.targetTypeKey = 2;
    this.bizTypeKey = this.oldBizTypeId;
    if (this.keyword && this.keyword.trim() !== "") {
      this.checkPageKeyword($event);
    }
  }

  checkIsNoSelect() {
    if (this.targetTypeKey == 0 && (this.userIdKey == 0 || this.userIdKey == -1)) {
      return false;
    }
    if (this.targetTypeKey == 3 && (this.channelIdKey == 0 || this.channelIdKey == -1)) {
      return false;
    }
    if (this.targetTypeKey == 2 && (this.bizTypeKey == 0 || this.bizTypeKey == -1)) {
      return false;
    }
    return true;
  }

  // 界面检查
  checkPageKeyword($event) {
    if (this.keyword && this.keyword.trim()) {
      this.validate = "success";
    } else {
      this.validate = "error";
      this.required = true;
    }
    if (!this.checkIsNoSelect()) {
      return;
    }
    // 改变远程校验请求参数
    this.nparam.url =
      URLS.smsAutoBlackListKeywordExist.url +
      "/" +
      this.channelIdKey +
      "/" +
      this.targetTypeKey +
      "/" +
      this.userIdKey +
      "/" +
      this.record.id +
      "/" +
      this.bizTypeKey;
    // 重置状态
    this.required = undefined;
    this.duplicated = undefined;
    this.validate = this.keyword;
    // 先校验页面输入数据
    if (this.keyword && this.keyword.trim() !== "") {
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
              this.isKeyWordNotExist = false;
            }
          } else {
            // 通过远程校验
            if (!this.keyword || this.keyword === "") {
              this.validate = "error";
              this.required = true;
              this.duplicated = undefined;
            } else {
              this.validate = "success";
              this.duplicated = undefined;
              this.required = undefined;
            }
            this.isKeyWordNotExist = true;
          }
        } else {
          this.dialogService.notification.error("关键字校验", "关键字远程唯一性校验失败");
        }
      });
    } else {
      this.validate = "error";
      this.required = true;
      this.duplicated = undefined;
    }
  }

  // 选择全消息类型， 则其他消息类型置灰，不选中。 全部不选中，则所有显示出来。 选中非全消息类型，则全消息类型置灰，不选中
  checkEvent(event) {
    if (this.isRelevance === "c") {
      if (event !== null && event.length > 0) {
        this.getBizTypes();
      } else {
        this.linkedBizTypes = [];
      }
    } else if (this.isRelevance === "d") {
      if (event !== null && event.length > 0) {
        this.getChannel();
      } else {
        this.linkedChannels = [];
      }
    }
  }

  onblur(item) {
    if (!this.keyword || this.keyword === "") {
      this.validate = "error";
      this.required = true;
      this.duplicated = undefined;
    }
    if (this.required) {
      return;
    }
    this.checkPageKeyword(item);
  }

  save() {
    this.saveLoading = true;
    this.autoBlackList.autoMatchExtConfigs[0].content = this.keyword;
    let temp: any[] = [];
    let content = { paramType: 1, content: this.content };
    temp.push(content);
    // this.autoBlackList.autoRespConfigs[0].autoRespParams = temp;
    let typeObj, relObj;
    for (let i = 0; i < this.autoBlackList.autoRespConfigs.length; i++) {
      if (this.autoBlackList.autoRespConfigs[i].respType == 1) {
        relObj = this.autoBlackList.autoRespConfigs[i];
        this.autoBlackList.autoRespConfigs[i].autoRespParams = temp;
      } else if (this.autoBlackList.autoRespConfigs[i].respType == 2) {
        typeObj = this.autoBlackList.autoRespConfigs[i];
        this.autoBlackList.autoRespConfigs[i].autoRespParams && delete this.autoBlackList.autoRespConfigs[i].autoRespParams;
      }
    }
    if (!relObj) {
      relObj = {
        autoRespParams: temp,
        respType: 1,
        respMode: 0,
      };
      this.autoBlackList.autoRespConfigs.push(relObj);
    }
    const setTarget = (id = 0, type: number) => {
      if (typeObj) {
        typeObj.targetId = id;
        typeObj.targetType = type;
      }
      if (relObj) {
        relObj.targetId = 0;
        relObj.targetType = 0;
      }
    };

    if (this.isRelevance == "b") {
      setTarget(0, 1);
    } else if (this.isRelevance == "a") {
      for (let i = 0; i < this.autoBlackList.autoRespConfigs.length; i++) {
        if (this.autoBlackList.autoRespConfigs[i]) {
          this.autoBlackList.autoRespConfigs[i].targetId = this.autoBlackList.userId;
          this.autoBlackList.autoRespConfigs[i].targetType = 0;
        }
      }
    } else if (this.isRelevance == "c") {
      setTarget(this.autoBlackList.bizTypeId, 2);
    } else if (this.isRelevance == "d") {
      setTarget(this.autoBlackList.channelId, 3);
    }

    let tempAutoMatchExtConfig = this.autoBlackList.autoMatchExtConfigs[0];
    this.autoBlackList.autoMatchExtConfigs = [];
    let tempExtConfig = deepCopy(tempAutoMatchExtConfig);
    tempExtConfig.msgType = this.msgType;
    this.autoBlackList.autoMatchExtConfigs.push(tempExtConfig);

    let url = URLS.smsAutoBlackListAdd.url;
    if (this.record && this.record.id > 0) {
      url = URLS.smsAutoBlackListEdit.url;
    }

    this.http.post(url, this.autoBlackList).subscribe(res => {
      if (res.status === 0) {
        this.dialogService.notification.success(`${this.operation}${this.subject}`, `${this.operation}成功`);
        this.modal.close(true);
        this.saveLoading = false;
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
        this.saveLoading = false;
      }
    });
  }

  close() {
    this.modal.close();
  }

  searchAccount(event) {
    !event || event.trim() === "" ? (this.account = "-1") : (this.account = event);
    this.getUsers();
  }

  searchBizTypes(event) {
    !event || event.trim() === "" ? (this.bizType = "-1") : (this.bizType = event);
    this.getBizTypes(event);
  }

  searchChannel(event) {
    !event || event.trim() === "" ? (this.channel = "-1") : (this.channel = event);
    this.getChannel();
  }
}
