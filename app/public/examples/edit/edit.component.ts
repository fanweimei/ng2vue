// @ts-nocheck
// 模型相关添加
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  TemplateRef,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import {
  STColumn,
  STRes,
  STChange,
  STComponent,
  STData,
  STReq,
  STRequestOptions,
  STPage,
} from "@delon/abc/st";
import { URLS } from "@shared";
import { _HttpClient } from "@delon/theme";
import { NzModalRef } from "ng-zorro-antd/modal";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { deepCopy } from "@delon/util";
import { DialogService } from "@icc/common-lib";
import type { Rule } from "ant-design-vue/es/form";
import { default as msgJson } from "./shared/constant/apppush.json";
import * as components from "./components";
import routes from "./buss-route";

@Component({
  selector: "app-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.less"],
})
export class BlackListEditComponent2
  implements OnInit, AfterViewInit, AfterViewChecked
{
  constructor(
    private modal: NzModalRef,
    public http: _HttpClient,
    private fb: UntypedFormBuilder,
    private dialogService: DialogService
  ) {}

  isVisible = true;
  listCountLoading = false;

  // 默认选中业务分类黑名单
  strategyType = 4;
  target = null;
  userEnums: any[] = [];
  userEnumsBack: any[] = [];
  bizEnums: any[] = [];
  bizEnumsBack: any[] = [];
  bizClassEnums: any[] = [];
  bizClassEnumsBack: any[] = [];

  url: string = "";
  @Input() record: any;
  @Input() cfgs: any = {};
  @Output() onClose = new EventEmitter<boolean>();
  subject = "黑名单";
  LABEL: any[] = [
    "关联账号",
    "全局黑名单",
    "关联业务模板",
    "关联渠道",
    "关联业务分类",
  ];

  page: STPage = {};
  stTotal = 0;
  pageSize = 5;

  searchOptions: any = {
    name: "",
  };
  req: STReq = {
    method: "POST",
    allInBody: true,
    body: {
      params: {},
    },
    process: (requestOptions: STRequestOptions) => {
      return requestOptions;
    },
  };
  uniqueId = "";

  // mock
  columns: STColumn[] = [
    {
      title: "编号",
      index: "id",
      type: "checkbox",
    },
  ];
  form: UntypedFormGroup = this.fb.group({
    id: new UntypedFormControl(null),
    target: new UntypedFormControl(null, [
      Validators.required,
      Validators.min(0),
    ]),
    fansOpenIdList: new UntypedFormControl(null, [Validators.required]),
    strategyType: new UntypedFormControl("2", [Validators.required]),
    channelId: new UntypedFormControl("", Validators.required),
    errorItems: this.fb.array([]),
    id2: [null],
    name: [
      null,
      [
        Validators.required,
        Validators.pattern("^[\u4e00-\u9fa5a-zA-Z0-9]{1,20}$"),
      ],
    ],
    userName: "fanweimei",
  });

  @ViewChild("st", { static: false }) private st: STComponent;
  @ViewChild("totalTemplate") totalTemp: TemplateRef<any>;
  selectList: any[] = [];
  checkedList: any[] = [];
  openIdList: any[] = [];
  res: STRes = {
    process: (data) => {
      // ps:st组件在8.x版本只能通过process钩子监听数据加载
      return data.map((i: STData) => {
        this.processRepeatPart(
          data,
          this.selectList,
          this.cfgs.key === "wechat" ? "openId" : "id",
          this.lockItem
        );
        return i;
      });
    },
  };
  getTableList(isSearch?: Boolean, isChange?: Boolean) {
    let params: any = {
      target: this.form.get("target")?.value,
      strategyType: this.form.get("strategyType")?.value,
    };
    params.channelId = this.record.channelId;
    if (isChange) {
      this.searchOptions.name = "";
    }
    params[this.searchOptions.field] = this.searchOptions.name;
    // 查询时检查target是否存在，否则查询失败
    if (isSearch && !params.target && !isChange) {
      this.dialogService.notification.error(
        this.subject,
        `请选择${this.LABEL[this.strategyType]}`
      );
      return;
    } else {
      this.st.reset({
        params: params,
      });
    }
    if (this.cfgs.key === "wechat") {
      this.getWechatBlacklistUsersCount(params);
    }
  }
  getWechatBlacklistUsersCount(params) {
    this.listCountLoading = true;
    this.http.post(URLS.wechatBlacklistUsersCount.url, params).subscribe(
      (res) => {
        this.stTotal = res.data;
        this.listCountLoading = false;
      },
      (err) => {
        this.listCountLoading = false;
      }
    );
  }

  changeAccount() {
    this.selectList = [];
    this.checkedList = [];
    this.openIdList = [];
    if (this.openIdList.length === 0) {
      this.form.get("fansOpenIdList")?.setValue(null);
    } else {
      this.form.get("fansOpenIdList")?.setValue(this.openIdList);
    }
    this.getTableList();
  }

  ngOnInit() {
    this.initByCfgs();
    this.getUsers();
    this.getBizTypes();
    this.getBizTypesClass();
    // 设置默认第一项为业务分类黑名单
    this.form.get("strategyType")?.setValue("4");
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.getTableList();
      if (this.cfgs.key === "wechat") {
        this.st.orgTable.nzShowTotal = this.totalTemp;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.cfgs.key === "wechat") {
      this.st.orgTable.nzShowTotal = this.totalTemp;
    }
  }

  initByCfgs() {
    this.subject = this.cfgs.subject + this.subject;
    const columns = this.record.columns || [];
    for (let item of columns) {
      if (item.search) {
        this.searchOptions.header = item.title;
        this.searchOptions.field = item.index;
      }
      if (item.title.includes("收信ID")) {
        this.uniqueId = item.index;
      }
    }
    this.url = URLS[`${this.cfgs.key}BlacklistUsers`].url;
    this.columns = this.columns.concat(columns);
    this.req.body.params.channelId = this.record.channelId;
  }

  getUsers() {
    this.http.post(URLS.blacklistAllUsersForNew.url).subscribe((res) => {
      let userList = res.data;
      if (userList.length > 0) {
        userList.forEach((user) => {
          this.userEnums.push({ label: user.account, value: user.id });
          this.userEnumsBack.push({ label: user.account, value: user.id });
        });
      }
    });
  }

  getBizTypes() {
    this.http
      .post(URLS[`${this.cfgs.key}BlacklistBizType`].url)
      .subscribe((res) => {
        let bizList = res.data;
        if (bizList.length > 0) {
          bizList.forEach((bizType) => {
            this.bizEnums.push({ label: bizType.name, value: bizType.id });
            this.bizEnumsBack.push({ label: bizType.name, value: bizType.id });
          });
        }
      });
  }

  getBizTypesClass() {
    this.http
      .get(
        URLS[`${this.cfgs.key}BlacklistBizTypeClass`].url +
          "/" +
          this.cfgs.en_name +
          "/" +
          this.cfgs.type
      )
      .subscribe((res) => {
        let bizClassList = res.data;
        if (bizClassList.length > 0) {
          bizClassList.forEach((bizType) => {
            this.bizClassEnums.push({
              label: bizType.bizCatName,
              value: bizType.id,
            });
            this.bizClassEnumsBack.push({
              label: bizType.bizCatName,
              value: bizType.id,
            });
          });
        }
      });
  }

  save(value: any) {
    if (value.strategyType == 1) {
      value.target = 0;
    }
    if (this.record.channelId != undefined) {
      value.channelId = this.record.channelId;
    }
    let url = URLS[`${this.cfgs.key}BlacklistAdd`].url;
    this.http.post(url, value).subscribe((res) => {
      if (res.status === 0) {
        this.dialogService.notification.success(
          this.subject,
          "微信黑名单操作成功"
        );
        this.modal.close(true);
        this.onClose.emit(true);
      } else {
        if (this.record.id > 0) {
          this.dialogService.notification.error(this.subject, res.errorMsg);
        } else {
          this.dialogService.notification.error(this.subject, res.errorMsg);
        }
      }
    });
  }

  close() {
    this.modal.close(true);
    this.onClose.emit(false);
  }
  change(e: STChange) {
    // this.getTableList()
    if (e.type) {
      // ps:如果st版本为9.x，数据监听可在这里控制
      switch (e.type) {
        case "checkbox":
          this.addCheckedList(e.checkbox || []);
          break;
        case "pi":
          this.clearCheckedList();
          break;
        default:
          break;
      }
    }
  }
  onFilters(value, sourceList, target) {
    this[target] = value
      ? sourceList.filter((e) => e.label.indexOf(value) > -1)
      : deepCopy(sourceList);
  }
  processRepeatPart(
    source: Array<any>,
    target: Array<any>,
    params: string,
    fn?: CallableFunction
  ): Array<any> {
    const temp: any[] = [];
    source.map((it) => {
      target.map((v) => {
        if (v[params] === it[params]) {
          temp.push(it);
          // tslint:disable-next-line: no-unused-expression
          fn && fn(it);
        }
      });
    });
    return temp;
  }
  lockItem(target: object): void {
    Object.assign(target, {
      checked: true,
      disabled: true,
    });
  }
  unlockItem(target: object): void {
    Object.assign(target, {
      checked: false,
      disabled: false,
    });
  }
  addSelectList() {
    this.selectList.push(...this.checkedList);
  }
  removeSelectList(index: number | Array<any>): void {
    const _list = typeof index === "number" ? [index] : index;
    _list.forEach((i) => this.selectList.splice(i, 1));
  }
  clearSelectList() {
    this.selectList = [];
    this.addItem();
  }
  addCheckedList(target: Array<any>): void {
    this.checkedList = target;
  }
  clearCheckedList(): void {
    this.checkedList = [];
  }
  addItem(): void {
    for (let item of this.checkedList) {
      if (item.strategyType !== null) {
        this.dialogService.notification.error(
          this.subject,
          `黑名单列表已存在该${this.cfgs.terminalId.idName}`
        );
        return;
      }
    }
    this.addSelectList();
    this.clearCheckedList();
    this.openIdList = [];
    this.selectList.forEach((one) => {
      this.openIdList.push(one[this.uniqueId]);
    });
    this.form.get("fansOpenIdList")?.setValue(this.openIdList);
    this.st.reload();
  }

  removeItem(index: number, item: any): void {
    this.removeSelectList(index);
    this.openIdList = [];
    this.selectList.forEach((one) => {
      this.openIdList.push(one[this.uniqueId]);
    });
    if (this.openIdList.length === 0) {
      this.form.get("fansOpenIdList")?.setValue(null);
    } else {
      this.form.get("fansOpenIdList")?.setValue(this.openIdList);
    }
    this.st.reload();
  }
  deleteHelperAttribute() {
    for (const iterator of this.selectList) {
      if ("checked" in iterator) delete iterator.checked;
      if ("disabled" in iterator) delete iterator.disabled;
    }
  }
  handleOk() {
    this.deleteHelperAttribute();
    this.isVisible = false;
  }
  strategyTypeChange(value: any) {
    this.selectList = [];
    this.checkedList = [];
    this.openIdList = [];
    if (this.openIdList.length === 0) {
      this.form.get("fansOpenIdList")?.setValue(null);
    } else {
      this.form.get("fansOpenIdList")?.setValue(this.openIdList);
    }
    this.strategyType = value;
    if (this.strategyType == 1) {
      this.form.get("target")?.setValue("0");
    } else {
      this.form.get("target")?.setValue(null);
    }
    this.getTableList(true, true);
  }
  formatStrategy(type) {
    let result = "-";
    switch (type) {
      case 0:
        result = "账号黑名单";
        break;
      case 1:
        result = "全局黑名单";
        break;
      case 2:
        result = "业务模板黑名单";
        break;
      case 4:
        result = "业务分类黑名单";
        break;
      default:
        break;
    }
    return result;
  }
}
