import { Component, OnInit, ViewChild } from "@angular/core";
import {
  STChange,
  STColumn,
  STData,
  STReq,
  STRequestOptions,
  STRes,
} from "@delon/abc/st";
import { _HttpClient } from "@delon/theme";
import { URLS } from "@shared/constant/interface";
import { DialogService } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import { NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { Addressee } from "src/app/routes/message/Addressee";
import { AppPushUser } from "src/app/routes/message/AppPushUser";

@Component({
  selector: "app-apppush-address",
  templateUrl: "./apppush-address.component.html",
  styleUrls: ["./apppush-address.component.less"],
})
export class ApppushAddressComponent implements OnInit {
  constructor(
    private http: _HttpClient,
    private dialogService: DialogService,
    private modal: NzModalRef
  ) {}

  @ViewChild("appPushViewSt", { static: false }) appPushViewSt: any;

  loading = false;

  appPushAccounts: NzTreeNodeOptions[] = [];

  statusList = [
    {
      label: "全部",
      value: -1,
    },
    {
      label: "在线",
      value: 1,
    },
    {
      label: "离线",
      value: 0,
    },
  ];

  expandForm = false;

  // AppPush用户列表表格数据
  appPushAddressUrl = URLS.appPushFansList.url;

  appPushSearchOptions: any = {
    channelId: -1,
    xwRegId: "",
    brand: "",
    alias: "",
    status: -1,
  };

  _groupLen: number;
  _groupName: string;

  _regId = "";
  _brand = "";
  _status = "";
  _alias = "";

  selectedRows: STData[] = [];

  appPushRes: STRes = {
    process: (data, rawData) => {
      this._groupLen = rawData.total;
      return data;
    },
  };
  req: STReq = {
    method: "POST",
    allInBody: true,
    lazyLoad: true,
    body: {
      params: {
        groupId: "",
        path: "",
        state: "0",
        source: "-1",
      },
    },
    process: (requestOptions: STRequestOptions) => {
      return requestOptions;
    },
  };

  appPushViewCols: STColumn[] = [
    {
      title: "",
      index: "key",
      type: "checkbox",
      fixed: "left",
      width: 50,
    },
    {
      title: "RegId",
      width: 222,
      render: "tpl-regid",
      className: "text-center",
    },
    {
      title: "别名",
      width: 182,
      render: "tpl-alias",
      className: "text-center",
    },
    {
      title: "在线状态",
      type: "tag",
      index: "status",
      className: "text-center",
      width: 100,
      tag: {
        1: { text: "在线", color: "green" },
        0: { text: "离线", color: "grey" },
      },
    },
    {
      title: "手机厂商",
      index: "brand",
      width: 120,
      className: "text-center",
    },
    {
      title: "手机型号",
      width: 120,
      index: "phoneModel",
      className: "text-center",
    },
  ];

  // 用户选择的收信人列表
  selectAddress: Addressee[] = [];

  addee: Addressee = new Addressee();

  selectCount = 0;

  appPushUsers: AppPushUser[] = [];

  // 选择后显示在表头的收信人列表
  records: Addressee[] = [];

  _deptId = "-1";

  okSelect = false;

  actIndex: any = null;

  // appPush channelId
  appPushChannelId = null;

  iconImg4 = "./assets/images/msgType/jpush.png";

  // 当前appPush appid
  @Input() appId = "";

  ngOnInit(): void {
    this.getAppPushAccounts();
    this.selectAddress = [];
    this._groupName = "AppPush收信人";
    this.okSelect = false;
  }

  // 获取App应用
  getAppPushAccounts() {
    this.loading = true;
    this.http.post(URLS.appPushAppList.url, {}).subscribe((res) => {
      this.loading = false;
      if (res.status === 0 && res.data.length > 0) {
        this.appPushAccounts = res.data.filter((item) => {
          return item.appId === this.appId;
        });
        this.appPushSearchOptions.channelId = this.appPushAccounts[0].appId;
        this.appPushChannelId = this.appPushAccounts[0].appId;
        this._groupName = this.appPushAccounts[0].name;
        this.actIndex = 0;
        this.resetTableList();
      }
    });
  }

  getTableList() {
    this._regId = this.appPushSearchOptions.xwRegId;
    this._brand = this.appPushSearchOptions.brand;
    this._status = this.appPushSearchOptions.status;
    this._alias = this.appPushSearchOptions.alias;
    this.appPushViewSt.reset({
      params: {
        id: this.appPushSearchOptions.channelId,
        xwRegId: this.appPushSearchOptions.xwRegId,
        brand: this.appPushSearchOptions.brand,
        status:
          this.appPushSearchOptions.status === -1
            ? null
            : this.appPushSearchOptions.status,
        alias: this.appPushSearchOptions.alias,
      },
    });
  }

  appPushstChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox!;
        this.addee = null!;
        let temp = new Addressee();
        let len = this.selectedRows.length;
        this.selectCount = len;
        if (len > 0) {
          this.appPushUsers = [];
          this.addee = new Addressee();
          this.addee.contacts = [];
          this.addee.len = len;
          if (this._groupName) {
            this.addee.name = this._groupName;
          }
        }
        for (let row of this.selectedRows) {
          let appPushUser = new AppPushUser();
          appPushUser.id = row.id;
          appPushUser.channelId = row.channelId;
          // 【重要变更】：为了脱敏， 这里需要传给后台 xwRegIdAes
          // appPushUser.xwRegId = row.xwRegId;
          appPushUser.xwRegId = row.xwRegIdAes || "";
          appPushUser.brand = row.xwRegId;
          appPushUser.brand = row.brand;
          appPushUser.phoneModel = row.phoneModel;
          appPushUser.downTime = row.downTime;
          appPushUser.remove = row.remove;
          let contact = ",,,,,," + row.xwRegIdAes || "";
          this.addee.contacts.push(contact);
          this.appPushUsers.push(appPushUser);
        }
        temp.len = len;
        temp.name = this._groupName;
        let c = true;
        this.records = this.records.filter((item) => {
          if (item.name === temp.name) {
            c = false;
            item.len = len;
          }
          return !(item.name === temp.name && len === 0);
        });
        if (c && len > 0) {
          this.records.push(temp);
        }
        break;
      case "filter":
        console.log(e);
        break;
      case "pi":
        this.selectedRows = [];
        break;
    }
  }

  // AppPush添加全部收信人
  addAllAppPush(): void {
    if (!this._groupLen || this._groupLen < 1) {
      this.dialogService.notification.warning("提示", "该分组没有数据");
      return;
    }
    let temp = new Addressee();
    temp.contacts = [];
    temp.id = new Date().getTime();
    temp.name = this._groupName;
    temp.len = this._groupLen;
    if ("-1" === this._deptId) {
      this._deptId = this.appPushAccounts[0].id;
    }
    let c =
      "i" +
      (this._regId || "") +
      "$" +
      (this._brand || "") +
      "$" +
      (this._status || "") +
      "$" +
      (this._alias || "") +
      "$" +
      this.appPushChannelId +
      "$";
    temp.contacts.push(c);
    this.selectAddress.push(temp);
    this.okSelect = true;
  }

  // AppPush添加当前选中的收信人
  addSelectedAppPush(): void {
    if (!this.addee || this.addee.len < 1) {
      this.dialogService.notification.warning("提示", "没有勾选中任何数据");
      return;
    }
    if (this.addee && this.addee.len > 0) {
      let temp = new Addressee();
      temp.id = new Date().getTime();
      temp.name = this.addee.name;
      temp.len = this.addee.len;
      temp.contacts = this.addee.contacts;
      // alert(temp.contacts);
      this.selectAddress.push(temp);
      this.okSelect = true;
    }
  }

  resetTableList() {
    // 重置搜索条件
    this.appPushSearchOptions.xwRegId = "";
    this.appPushSearchOptions.brand = "";
    this.appPushSearchOptions.status = -1;
    this.appPushSearchOptions.alias = "";

    // 重新加载table数据
    this.getTableList();
  }

  getFans(item, itemIdx) {
    this.actIndex = itemIdx;
    this.appPushSearchOptions.channelId = item.appId;
    this.appPushChannelId = item.appId;
    this._groupName = item.name;
    this.resetTableList();
  }

  handleCancel(): void {
    this.modal.destroy();
  }

  handleOk(): void {
    if (this.selectAddress instanceof Array && this.selectAddress.length > 0) {
      this.selectAddress.map((item) => (item.icon = this.iconImg4));
      this.modal.close(this.selectAddress);
    }
  }

  // 弹窗页面tag删除事件
  onTagClose2(event) {
    let x = this.selectAddress.findIndex((obj) => obj.id === event.id);
    this.selectAddress.splice(x, 1);
    if (this.selectAddress && this.selectAddress.length < 1) {
      this.okSelect = false;
    }
  }
}
