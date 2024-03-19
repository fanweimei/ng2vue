import { Component } from "@angular/core";
import { DialogService, isArray, MsgTemplateAudit, TplAuditData } from "@icc/common-lib";
import { _HttpClient } from "@delon/theme";
import { URLS } from "../../shared/constant/interface";
import { MSG_TYPE, MSG_APPTYEP } from "../../shared/constant/msgType";

@Component({
  selector: "icc-sms-tpl-audit",
  templateUrl: "./sms-tpl-audit.component.html",
  styleUrls: ["./sms-tpl-audit.component.less"],
})
export class SmsTplAuditComponent implements MsgTemplateAudit {
  constructor(private dialogService: DialogService, private http: _HttpClient) {}
  static SCENE = "icc-msg-tpl-audit";
  type = MSG_TYPE;
  // 模板列表
  tplList: any;
  // 数据操作状态
  operate = { normal: 0, add: 1, delete: 2, update: 3 };
  // 是否打开修改标记
  openEffect: boolean;
  // 短信模板是否被全部删除
  isAllDel: boolean = false;
  // 短信签名
  signature;
  // 是否属于删除进审
  isDelete: boolean;

  // 是否是M消息
  isAim: boolean = false;

  tableConfig = {
    header: ["类型", "条件名称", "条件描述"],
    attr: [
      {
        name: "conType",
        type: "object",
      },
      {
        name: "name",
        type: "object",
      },
      {
        name: "desc",
        type: "array",
      },
    ],
  };
  // 逻辑关系
  relationTypes = {
    1: '"与"关系',
    2: '"或"关系',
  };
  useTmplMethod: number;
  /* 赋值 */
  setData(data: TplAuditData[], useTmplMethod: number, applicationTypeList?) {
    // 判断是否是M消息
    if (applicationTypeList && applicationTypeList.length) {
      applicationTypeList.forEach(item => {
        let val = [MSG_APPTYEP.aim, "M消息"];
        if (val.includes(item.value) || (item.type === this.operate.delete && val.includes(item.oldValue))) {
          this.isAim = true;
        }
      });
    }
    this.tplList = data;
    this.useTmplMethod = useTmplMethod;
    this.getUserSignature();
    this.isAllDel = this.tplList.every(item => item.type === this.operate.delete);
  }
  /* 切换展示状态 */
  switchDisplayStatus(isOpenEffect: boolean) {
    this.openEffect = isOpenEffect;
  }

  // 是否删除进审
  getDeleteValue(isDel: boolean) {
    this.isDelete = isDel;
  }

  // 判断执行条件中的有用的执行条件数量是否大于一
  isRealConditionsOverOne(list) {
    if (list && isArray(list)) {
      let temp = list.filter(item => {
        // 原判断条件
        // return item.type === 1 || item.type === 0;
        // 2023/05/16 修改代码为：未被删除的执行条件都认为是有效的执行条件
        return item.type !== 2;
      });
      if (temp && temp.length > 1) {
        return true;
      } else {
        return false;
      }
    }
    return false;
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
}
