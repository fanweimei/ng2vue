import { Component, OnInit, ViewChild } from "@angular/core";
import {
  STChange,
  STColumn,
  STData,
  STReq,
  STRequestOptions,
  STRes,
} from "@delon/abc/st";
import { SFComponent, SFSchema, SFUISchema } from "@delon/form";
import { _HttpClient } from "@delon/theme";
import { URLS } from "@shared/constant/interface";
import { DialogService } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import { NzFormatEmitEvent, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { tap } from "rxjs/operators";
import { Addressee } from "src/app/routes/message/Addressee";
import { WorkwxUser } from "src/app/routes/message/WorkwxUser";

@Component({
  selector: "app-workwx-address",
  templateUrl: "./workwx-address.component.html",
  styleUrls: ["./workwx-address.component.less"],
})
export class WorkwxAddressComponent implements OnInit {
  constructor(
    private http: _HttpClient,
    private dialogService: DialogService,
    private modal: NzModalRef
  ) {}

  loading = false;

  workwxNodes: NzTreeNodeOptions[] = [];

  defaultExpandedKeys = ["1"]; // 默认展开根节点
  defaultSelectedKeys = ["1"]; // 默认选中根节点
  defaultCheckedKeys = ["1"]; // checkbox默认选中的节点

  ui: SFUISchema = {
    $mobile: {
      widget: "string",
      width: 250,
      placeholder: "请输入完整的手机号码",
    },
    $name: {
      widget: "string",
      width: 195,
      placeholder: "请输入完整的姓名",
    },
  };

  searchWorkwxSchema: SFSchema = {
    properties: {
      name: {
        type: "string",
        title: "姓名",
      },
      mobile: {
        type: "string",
        title: "手机号码",
      },
      params: {
        type: "object",
        properties: {
          deptId: {
            type: "number",
            title: "部门ID",
            ui: {
              hidden: true,
            },
          },
        },
      },
    },
  };

  selectedRows: STData[] = [];

  // 用户选择的收信人列表
  selectAddress: Addressee[] = [];

  @ViewChild("workwxst", { static: false }) workwxst: any;
  workwxColumns: STColumn[] = [
    {
      title: "",
      index: "key",
      type: "checkbox",
      // width: 50,
    },
    {
      title: "姓名",
      index: "name",
      width: 90,
    },
    {
      title: "手机号码",
      index: "mobile",
      width: 130,
    },
    {
      title: "职位",
      index: "position",
      width: 234,
    },
    {
      title: "邮箱",
      index: "email",
      width: 235,
    },
  ];
  @ViewChild("workwxsf", { static: false }) workwxsf: SFComponent;

  // 企业微信通讯录表格数据
  workwxAddressUrl = URLS.workwxUsersList.url;

  _groupLen: number;

  workwxRes: STRes = {
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

  _deptId = "-1";
  workwxUsers: WorkwxUser[] = [];

  // 当前企业微信的appId
  @Input() workwxAppId = "";

  _qName = "";

  _mobile = "";

  // 记录当前逐个选中的收信人
  addee: Addressee = new Addressee();

  // 总选择多少项
  selectCount = 0;

  _groupName: string;

  // 选择后显示在表头的收信人列表
  records: Addressee[] = [];

  okSelect = false;

  iconImg1 = "./assets/images/send/contact-blue.png";

  ngOnInit(): void {
    this.getWorkwxAddress();
    this.selectAddress = [];
    this._groupName = "企业微信收信人";
    this.okSelect = false;
    this.loading = true;
    setTimeout(() => {
      this.workwxst.reset({
        params: {
          name: "",
          mobile: "",
          deptId: "-1",
          appId: this.workwxAppId,
        },
      });
      this.workwxsf.reset();
    }, 0);
  }

  getWorkwxAddress() {
    this.workwxNodes = [];
    this.loading = true;
    this.http
      .post(URLS.workwxDeptsList.url)
      .pipe(tap(() => (this.loading = false)))
      .subscribe(
        (res) => {
          if (res.status === 0 && res.data) {
            this.workwxNodes = res.data;
          } else {
            this.dialogService.notification.error("错误", res.errorMsg);
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  searchWorkwxList() {
    this.searchWorkwx(this.workwxsf.value);
  }

  searchWorkwx(params) {
    params.deptId = this._deptId;
    params.appId = this.workwxAppId;
    this._qName = params.name;
    this._mobile = params.mobile;
    this.workwxst.reset({ params });
  }

  workwxstChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox!;
        this.addee = null!;
        let temp = new Addressee();
        let len = this.selectedRows.length;
        this.selectCount = len;
        if (len > 0) {
          this.workwxUsers = [];
          this.addee = new Addressee();
          this.addee.contacts = [];
          this.addee.len = len;
          if (this._groupName) {
            this.addee.name = this._groupName;
          }
        }
        for (let row of this.selectedRows) {
          let workwxUser = new WorkwxUser();
          workwxUser.workWXUserId = row.workWXUserId;
          workwxUser.openUserId = row.openUserId;
          workwxUser.mobile = row.mobile;
          workwxUser.name = row.name;
          let contact = ",,,,,,,," + row.workWXUserId;
          this.addee.contacts.push(contact);
          this.workwxUsers.push(workwxUser);
        }
        temp.len = len;
        temp.name = this._groupName;
        let c = true;
        let i = 0;
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

  resetWorkwxList() {
    this.workwxsf.reset();
    this.workwxst.reset({
      params: {
        name: "",
        mobile: "",
        deptId: "-1",
        appId: this.workwxAppId,
      },
    });
  }

  // 企业微信添加全部收信人
  addAllWorkwx(): void {
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
      this._deptId = this.workwxNodes[0].id;
    }
    let c =
      "q" +
      (this._qName || "") +
      "$" +
      (this._mobile || "") +
      "$" +
      this._deptId +
      "$" +
      this.workwxAppId +
      "$" +
      this._groupLen;
    temp.contacts.push(c);
    // alert(c);
    this.selectAddress.push(temp);
    this.okSelect = true;
  }

  // 企业微信添加当前选中的收信人
  addSelectedWorkwx(): void {
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

  // 点击企业微信分组节点
  workwxEvent(event: NzFormatEmitEvent): void {
    if (event.node) {
      this._deptId = event.node.origin.id;
      this._groupName = event.node.origin.title;
      // 在这里替换掉根节点的名称
      if (event.node.parentNode === null) {
        this._groupName = "企业微信收信人";
      }
      this.workwxst.reset({
        params: {
          name: "",
          mobile: "",
          deptId: this._deptId,
          appId: this.workwxAppId,
        },
      });
      this.clean();
    }
  }

  clean(): void {
    this.records = [];
    this.selectCount = 0;
  }

  // 弹窗页面tag删除事件
  onTagClose2(event) {
    let x = this.selectAddress.findIndex((obj) => obj.id === event.id);
    this.selectAddress.splice(x, 1);
    if (this.selectAddress && this.selectAddress.length < 1) {
      this.okSelect = false;
    }
  }

  handleCancel(): void {
    this.modal.destroy();
  }

  handleOk(): void {
    if (this.selectAddress instanceof Array && this.selectAddress.length > 0) {
      this.selectAddress.map((item) => (item.icon = this.iconImg1));
      this.modal.close(this.selectAddress);
    }
  }
}
