import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { STChange, STColumn, STData, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import { SFButton, SFComponent, SFSchema, SFUISchema } from "@delon/form";
import { _HttpClient } from "@delon/theme";
import { URLS } from "@shared/constant/interface";
import { DialogService, isJsonString, MessageService, MsgPluginFilterService, TERMINALTYPE, MsgconfHelperService } from "@icc/common-lib";
import { NzFormatEmitEvent, NzTreeNode, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { zip, of } from "rxjs";
import { Subject } from "rxjs/internal/Subject";
import { switchMap } from "rxjs/operators";
import { Addressee } from "src/app/routes/message/Addressee";
import { Customer } from "src/app/routes/message/Customer";
import { ACLService } from "@delon/acl";
import { NzModalRef } from "ng-zorro-antd/modal";

@Component({
  selector: "app-commcenter",
  templateUrl: "./commcenter.component.html",
  styleUrls: ["./commcenter.component.less"],
})
export class CommcenterComponent implements OnInit, AfterViewInit {
  constructor(
    private messageService: MessageService,
    private dialogService: DialogService,
    private http: _HttpClient,
    private cdr: ChangeDetectorRef,
    private msgPluginFilterService: MsgPluginFilterService,
    private modal: NzModalRef,
    private confhelperService: MsgconfHelperService,
    private aclService: ACLService,
  ) {}

  @ViewChild("st", { static: false }) st: any;

  @ViewChild("sf", { static: false }) sf: SFComponent;

  @ViewChild("phonelist", { static: false }) viewpPoneListTree;
  @ViewChild("employeeTree", { static: false }) viewEmployeeListTree;

  isVisible = false;

  curTab = 0;
  showCustomer = false;
  showEmployee = false;

  loading = false;

  isRequestCount: boolean;

  nodes: NzTreeNodeOptions[] = [];
  employeeNodes: NzTreeNodeOptions[] = [];
  defaultExpandedKeys = ["1"]; // 默认展开根节点
  defaultSelectedKeys = ["1"]; // 默认选中根节点
  defaultCheckedKeys = ["1"];

  customerUrl = URLS.customerList.url;
  terminalType = TERMINALTYPE;

  // 用户选择的收信人列表
  selectAddress: Addressee[] = [];

  iconImg1 = "./assets/images/send/contact-blue.png";

  columns: STColumn[] = [
    {
      title: "",
      index: "key",
      type: "checkbox",
      className: "text-center",
      // width: 50,
    },
    {
      title: "姓名",
      // index: "name",
      width: 132,
      render: "templ-name",
      className: "text-center",
    },
    {
      title: "所属分组",
      index: "groups",
      render: "templ-group",
      width: 90,
      className: "text-center",
    },
  ];

  curPage: number = 0;
  lastItemIds: any = {};

  // 数据预处理
  res: STRes = {
    process: (data, rawData) => {
      if (data?.length) {
        this.lastItemIds[this.curPage] = data[data.length - 1]?.id;
      }
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
      this.curPage = requestOptions.body.pi;
      let id = this.curPage > 1 ? this.lastItemIds[this.curPage - 1] : null;
      requestOptions.body.params.id = id;
      return requestOptions;
    },
  };

  // 记录当前逐个选中的收信人
  addee: Addressee = new Addressee();
  customers: Customer[] = [];

  // 总选择多少项
  selectCount = 0;

  // 临时记录选中的组/标签
  _groupId: string;
  _path: string;
  _groupName: string;
  _groupLen: number;
  customerTotal: number = 0;
  employerTotal: number = 0;
  _officialAccountId: string;

  // 选择后显示在表头的收信人列表
  records: Addressee[] = [];

  // 记录当前导入的收信人
  importAddee: Addressee;
  _name = "";
  _distinctRows = false;
  _phone = "";
  selectedRows: STData[] = [];
  button: SFButton | null = null;
  searchSchema: SFSchema;
  ui: SFUISchema = {
    $phone: {
      widget: "string",
      width: 200,
      placeholder: "请输入完整的手机号码",
    },
    $name: {
      widget: "string",
      width: 175,
      placeholder: "请输入完整的姓名",
    },
    $distinctRows: {
      widget: "checkbox",
      width: 100,
    },
  };

  okSelect = false;

  contactsTotal$ = new Subject<any>();

  msgTypes: any;

  showPhoneSeach: boolean;

  ngOnInit(): void {
    this.showCustomer = this.aclService.canAbility("contacts.customer.list");
    this.showEmployee = this.aclService.canAbility("contacts.employee.list");
    this.contactsTotal$
      .pipe(
        switchMap(params => {
          let url = this.curTab == 0 ? URLS.customerTotal.url : URLS.employeeTotal.url;
          return this.http.post(url, {
            pi: this.st.pi,
            ps: this.st.ps,
            params,
          });
        }),
      )
      .subscribe(
        res => {
          this._groupLen = res.data || 0;
          this.isRequestCount = false;
          this.cdr.detectChanges();
        },
        err => {
          this.isRequestCount = false;
          this.cdr.detectChanges();
        },
      );

    this.loading = true;
    let getCustomerList = this.showCustomer ? this.http.get(URLS.customerGroupList.url) : of({ status: -1 });
    let getEmployeeList = this.showEmployee ? this.http.get(URLS.employeeGroupList.url) : of({ status: -1 });
    zip(getCustomerList, getEmployeeList).subscribe(
      ([customRes, employeeRes]) => {
        if (customRes.status === 0 && customRes.data) this.nodes = customRes.data;
        if (employeeRes.status === 0 && employeeRes.data) this.employeeNodes = employeeRes.data;
        this.customerTabChange(this.curTab);
        this.loading = false;
      },
      () => {
        this.loading = false;
      },
    );

    this.msgPluginFilterService.msgTypeFilter(msgTypes => {
      this.msgTypes = msgTypes;
      // 刷新通讯中心和客群的列表
      let msgAddColumns: any[] = [];
      this.msgTypes.forEach(item => {
        const msgIns = this.confhelperService.getStandardMessageHelperInstance(item.key);
        const arrayTerminal = msgIns?.getTerminalColumnConf ? msgIns.getTerminalColumnConf() : [];
        if (arrayTerminal.length) {
          arrayTerminal.forEach(tempItem => {
            if (!msgAddColumns.find(_item => _item.title === tempItem.title)) {
              msgAddColumns.push({ ...tempItem, className: "text-center" });
            }
          });
        }
      });
      // 通讯中心添加动态列
      this.columns = this.columns.concat(msgAddColumns);
      // 智能客群添加动态列
      this.st && this.st.resetColumns({ columns: this.columns, emitReload: true });
    });

    this.searchSchema = {
      properties: {
        name: {
          type: "string",
          title: "姓名",
        },
        params: {
          type: "object",
          properties: {
            groupId: {
              type: "number",
              title: "分组ID",
              ui: {
                hidden: true,
              },
            },
            path: {
              type: "string",
              title: "查询路径",
              ui: {
                hidden: true,
              },
            },
          },
        },
      },
    };
    this.showPhoneSeach = !!this.messageService.getData().find(item => ["sms", "voice", "rcs5g", "videoSms"].includes(item.en_name));
    if (this.showPhoneSeach) {
      this.searchSchema.properties!.phone = {
        type: "string",
        title: "手机号码",
      };
    }
    this.searchSchema.properties!.distinctRows = {
      type: "string",
      title: "去重",
    };
  }

  ngAfterViewInit(): void {
    const nodes = this.viewpPoneListTree.cdr._view ? this.viewpPoneListTree.cdr._view.nodes : [];
    if (nodes && nodes[0] && nodes[0].renderElement) {
      nodes[0].renderElement.style.padding = "18px";
      nodes[0].renderElement.style.width = "fit-content";
    }
    const paginations = this.st.el.nativeElement.getElementsByClassName("ant-table-pagination");
    if (paginations && paginations[0]) {
      paginations[0].style.paddingRight = "20px";
    }
  }

  stChange(e: STChange) {
    switch (e.type) {
      case "checkbox":
        this.selectedRows = e.checkbox!;
        this.addee = null!;
        let temp = new Addressee();
        let len = this.selectedRows.length;
        this.selectCount = len;
        if (len > 0) {
          this.customers = [];
          this.addee = new Addressee();
          this.addee.contacts = [];
          this.addee.len = len;
          if (this._groupName) {
            this.addee.name = this._groupName;
          }
        }
        for (let row of this.selectedRows) {
          let customer = new Customer();
          customer.code = row.code;
          // 【重要变更】：为了脱敏， 这里需要传给后台 phoneAes
          // customer.phone = row.phone || "";
          customer.phone = row.phoneAes || "";
          customer.name = row.name;
          let contact = row.code + "," + customer.phone;
          if (row.telephone && row.telephone.length > 3) {
            contact += "," + row.telephone;
          }
          this.addee.contacts.push(contact);
          this.customers.push(customer);
        }
        temp.len = len;
        temp.name = this._groupName;
        let c = true;
        this.records = this.records.filter((item, i) => {
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

  addAllContacts(): void {
    if (!this._groupLen || this._groupLen < 1) {
      this.dialogService.notification.warning("提示", "该分组没有数据");
      return;
    }
    let temp = new Addressee();
    temp.contacts = [];
    temp.id = new Date().getTime();
    temp.name = this._groupName;
    temp.len = this._groupLen;
    let c = "";
    if (this.curTab === 1) {
      c = "y" + this._groupId + "$" + this._path + "$" + this._groupLen + "$" + this._name + "$" + this._phone + "$" + this._distinctRows;
    }
    if (this.curTab === 0) {
      c = "g" + this._groupId + "$" + this._path + "$" + this._groupLen + "$" + this._name + "$" + this._phone + "$" + this._distinctRows;
    }
    temp.contacts.push(c);
    this.selectAddress.push(temp);
    this.okSelect = true;
  }

  searchCustomerList() {
    this.search(this.sf.value);
  }

  search(params) {
    params.groupId = this._groupId;
    params.path = this._path;
    params.state = "0";
    params.source = "-1";
    this._name = params.name == undefined ? "" : params.name;
    this._distinctRows = params.distinctRows ? true : false;
    this._phone = params.phone == undefined ? "" : this.showPhoneSeach ? params.phone : "";
    this.lastItemIds = {};
    this.st.reset({ params });
    this.requestContactsTotal(params);
  }

  requestContactsTotal(params) {
    this.isRequestCount = true;
    this.contactsTotal$.next(params);
  }

  resetCustomerList() {
    this.lastItemIds = {};
    this.sf.reset();
    this.st.reset({
      params: {
        groupId: this._groupId,
        path: this._path,
        phone: "",
        state: "-1",
        source: "-1",
        name: "",
        distinctRows: false,
      },
    });
    this.requestContactsTotal({
      groupId: this._groupId,
      path: this._path,
      phone: "",
      state: "-1",
      source: "-1",
      name: "",
      distinctRows: false,
    });
  }

  handleCancel(): void {
    this.modal.destroy();
  }

  handleOk(): void {
    // console.log(this.selectAddress);
    if (this.selectAddress instanceof Array && this.selectAddress.length > 0) {
      this.selectAddress.map(item => (item.icon = this.iconImg1));
      this.modal.close(this.selectAddress);
    }
  }

  customerTabChange(index: any) {
    let items = index === 0 ? this.nodes[0] : this.employeeNodes[0];
    let path = items?.path || "";
    let key = items?.key || "";
    this._name = "";
    this._phone = "";
    this._distinctRows = false;
    this._groupId = key;
    this._path = path;
    this._groupName = "收信人";
    this.customerUrl = index === 0 ? URLS.customerList.url : URLS.employeeList.url;
    this.curTab = index;
    this.lastItemIds = {};
    this.sf.reset();
    // 列表请求
    this.st.reset({
      params: {
        state: "0",
        path: this._path,
        groupId: this._groupId,
        source: "-1",
      },
    });
    // 总数请求
    this.requestContactsTotal({
      state: "0",
      path: this._path,
      groupId: this._groupId,
      source: "-1",
    });
    // 延迟选中节点项
    setTimeout(() => {
      this.defaultSelectedKeys = [this._groupId];
    }, 100);
  }

  nzEvent(event: NzFormatEmitEvent): void {
    const tmps: NzTreeNode[] = this.viewpPoneListTree.getSelectedNodeList();
    if (!tmps || tmps.length === 0) {
      // 没选中任何节点，当前节点则继续显示选中
      this.defaultSelectedKeys = [];
      this.defaultSelectedKeys.push(event.node?.key as string);
      return;
    }
    this.sf.reset();
    if (event.node) {
      this._groupId = event.node.origin.key;
      this._path = event.node.origin.path;
      this._groupName = event.node.origin.title;
      this._name = this.sf.value.name == undefined ? "" : this.sf.value.name;
      this._phone = this.sf.value.phone == undefined ? "" : this.showPhoneSeach ? this.sf.value.phone : "";
      // 在这里替换掉根节点的名称
      if (event.node.parentNode === null) {
        this._groupName = "收信人";
      }
      this.lastItemIds = {};
      this.st.reset({
        params: {
          state: "0",
          path: this._path,
          groupId: this._groupId,
          source: "-1",
          name: "",
          phone: "",
        },
      });
      this.requestContactsTotal({
        state: "0",
        path: this._path,
        groupId: this._groupId,
        source: "-1",
        name: "",
        phone: "",
      });
      this.clean();
    }
  }

  clean(): void {
    this.records = [];
    this.selectCount = 0;
  }

  employeeEvent(event: NzFormatEmitEvent): void {
    const tmps: NzTreeNode[] = this.viewEmployeeListTree.getSelectedNodeList();
    if (!tmps || tmps.length === 0) {
      // 没选中任何节点，当前节点则继续显示选中
      this.defaultSelectedKeys = [];
      this.defaultSelectedKeys.push(event.node?.key as string);
      return;
    }
    this.sf.reset();
    if (event.node) {
      this._groupId = event.node.origin.key;
      this._path = event.node.origin.path;
      this._groupName = event.node.origin.title;
      // 在这里替换掉根节点的名称
      if (event.node.parentNode === null) {
        this._groupName = "收信人";
      }
      this.lastItemIds = {};
      this.st.reset({
        params: {
          state: "0",
          path: this._path,
          groupId: this._groupId,
        },
      });
      this.requestContactsTotal({
        state: "0",
        path: this._path,
        groupId: this._groupId,
      });
      this.clean();
    }
  }

  // 添加当前选中的收信人
  addSelectedContacts(): void {
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
      this.selectAddress.push(temp);
      this.okSelect = true;
    }
  }

  // 弹窗页面tag删除事件
  onTagClose2(event) {
    let x = this.selectAddress.findIndex(obj => obj.id === event.id);
    this.selectAddress.splice(x, 1);
    if (this.selectAddress && this.selectAddress.length < 1) {
      this.okSelect = false;
    }
  }

  formatTerminal(item, teminalId) {
    let result = "";
    if (item.contactsTerminalDto && item.contactsTerminalDto.length) {
      const array = item.contactsTerminalDto
        .filter(t => t.terminal && t.terminalType == teminalId)
        .map(t => (isJsonString(t.terminal) ? JSON.parse(t.terminal) : t.terminal));
      if (array && array.length) {
        result = array.map(t => t.openId).join(", ");
      }
    }
    return result;
  }

  formatEmail(item, teminalId) {
    let result = "";
    if (item.contactsTerminalDto && item.contactsTerminalDto.length) {
      const findItem = item.contactsTerminalDto.find(t => t.terminal && t.terminalType == teminalId);
      if (findItem) result = findItem ? findItem.terminal : "";
    }
    return result;
  }

  formatAlias(item, teminalId) {
    let result = "";
    if (item.contactsTerminalDto && item.contactsTerminalDto.length) {
      const array = item.contactsTerminalDto.filter(t => t.alias && t.terminalType == teminalId);
      if (array && array.length) {
        result = array[0].alias;
      }
    }
    return result;
  }
}
