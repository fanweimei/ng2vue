import { Component, AfterViewInit, ViewChild } from "@angular/core";
import { STColumn, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import { _HttpClient } from "@delon/theme";
import { URLS } from "@shared/constant/interface";
import { DialogService, isJsonString, MessageService, MsgconfHelperService, MsgPluginFilterService, TERMINALTYPE } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import { NzFormatEmitEvent, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { Subject, zip } from "rxjs";
import { tap } from "rxjs/operators";
import { Addressee } from "src/app/routes/message/Addressee";

@Component({
  selector: "app-customer",
  templateUrl: "./customer.component.html",
  styleUrls: ["./customer.component.less"],
})
export class CustomerComponent implements AfterViewInit {
  constructor(
    private dialogService: DialogService,
    private http: _HttpClient,
    private modal: NzModalRef,
    private msgPluginFilterService: MsgPluginFilterService,
    private messageService: MessageService,
    private confhelperService: MsgconfHelperService,
  ) {}

  terminalType = TERMINALTYPE;

  nodes: NzTreeNodeOptions[] = [];
  defaultExpandedKeys = ["1"]; // 默认展开根节点
  defaultSelectedKeys = ["1"]; // 默认选中根节点
  defaultCheckedKeys = ["1"]; // checkbox默认选中的节点

  selectAddress: Addressee[] = [];

  okSelect = false;

  msgMap: { [key: string]: any } = {};

  msgTypes: any;

  // 智能客群
  @ViewChild("customerViewSt", { static: false }) customerViewSt: any;
  customerViewCols: STColumn[] = [
    {
      title: "姓名",
      render: "tpl-name",
      width: 132,
      className: "text-center",
    },
  ];

  curPage: number = 0;
  lastItemIds: any = {};

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

  customerViewUrl = URLS.smartCustomerList.url;

  @ViewChild("st", { static: false }) st: any;

  customerUrl = URLS.customerList.url;

  isRequestCount: boolean;

  contactsTotal$ = new Subject<any>();

  // 控制智能客群查询客群组数量
  isLoaded = false;
  // 记录当前选中的收信人组，用于添加全部操作
  gaddees: Addressee[] = [];

  iconImg3 = "./assets/images/btnIcon/kequn.png";

  loading = false;

  ngAfterViewInit(): void {
    this.msgPluginFilterService.msgTypeFilter(msgTypes => {
      this.getCustomerView();
      this.msgTypes = msgTypes;
      // 刷新通讯中心和客群的列表
      let msgAddColumns: any[] = [];
      this.msgTypes.forEach(item => {
        let msgItem = this.messageService.getMessageConfigByType(item.type);
        if (msgItem) {
          this.msgMap[item.key] = msgItem;
        }
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
      this.customerViewCols = this.customerViewCols.concat(msgAddColumns);
      // 智能客群添加动态列
      this.st &&
        this.st.resetColumns({
          columns: this.customerViewCols,
          emitReload: true,
        });
    });
  }

  getCustomerView() {
    this.loading = true;
    this.http
      .post(URLS.smartCustomerGroupList.url)
      .pipe(tap(() => (this.loading = false)))
      .subscribe(
        res => {
          this.nodes = res.data.filter(nodeItem => {
            if (nodeItem.count != -1) {
              nodeItem.title = nodeItem.name;
              return true;
            }
          });
          this.getTableList(this.nodes.length && this.nodes[0] ? this.nodes[0].key : null);
          this.defaultSelectedKeys = this.nodes.length && this.nodes[0] ? [this.nodes[0].key] : ["1"];
        },
        () => {
          this.loading = false;
        },
      );
  }

  requestContactsTotal(params) {
    this.isRequestCount = true;
    this.contactsTotal$.next(params);
  }

  // 点击智能客群组名节点
  cusViewEvent(event: NzFormatEmitEvent): void {
    if (event.node && event.node.origin) {
      const cusViewnode = event.node.origin;
      this.getTableList(+cusViewnode.key);
    }
  }

  getTableList(key) {
    if (key !== null && key !== undefined) {
      this.customerViewSt.reset({
        params: {
          source: "-1",
          customerName: "",
          key: Number(key),
        },
      });
    }
  }

  /* 复选框（取消）勾选 */
  async rowCheckedChange(event) {
    // 取消勾选
    // if (!event.nodes.length) return;

    // 点击勾选项时，无需执行this.cusViewEvent(event)查询客户通讯录列表

    // 无需调用URLS.smartCustomerList.url接口
    // 调用URLS.smartCustomerListCount.url接口，将数据封装后，缓存到对应node节点上
    this.gaddees = [];
    for (let i = 0; i < event.nodes.length; i++) {
      const node = event.nodes[i];
      node.isSelected = false;
      if (node.gadde) {
        this.gaddees.push(node.gadde);
      } else {
        const len = await this.reqCustomerListCount(node.key);
        const { title, key, logic } = node.origin;
        const tmp = new Addressee();

        tmp.len = Number(len);
        tmp.name = title;
        tmp.contacts = [];
        tmp.contacts.push("z" + key + "$" + logic + "$" + len);

        node.gadde = tmp;
        this.gaddees.push(tmp);
      }
    }
  }

  /* 请求客户通讯录列表总数 */
  reqCustomerListCount(nodeKey: string) {
    return new Promise((resolve, reject) => {
      this.http
        .post(URLS.smartCustomerListCount.url, {
          params: {
            source: "-1",
            customerName: "",
            key: +nodeKey,
          },
          pi: 1,
          ps: 1,
        })
        .subscribe(
          ({ status, data, errorMsg }) => {
            if (status === 0) {
              resolve(data);
            } else {
              resolve(0);
              this.dialogService.notification.error("请求失败", errorMsg);
            }
          },
          ({ errorMsg }) => {
            resolve(0);
            this.dialogService.notification.error("请求失败", errorMsg);
          },
        );
    });
  }

  // 复选框选中其中的客群组
  // cusViewCheck(event): void {
  //   this.cusViewEvent(event);
  //   this.gaddees = [];
  //   if (event.nodes && event.nodes.length > 0) {
  //     this.isLoaded = true;
  //     let ncount = event.nodes.length;
  //     event.nodes.forEach(n => {
  //       n.isSelected = false;
  //       const parma = {
  //         params: {
  //           source: "-1",
  //           customerName: "",
  //           key: +n.key,
  //         },
  //         pi: 1,
  //         ps: 1,
  //       };
  //       zip(this.http.post(URLS.smartCustomerList.url, parma), this.http.post(URLS.smartCustomerListCount.url, parma)).subscribe(
  //         ([res1, res2]) => {
  //           ncount--;
  //           if (res1.status === 0) {
  //             const cusViewNode = n.origin;
  //             const tmp = new Addressee();
  //             tmp.name = cusViewNode.title;
  //             tmp.contacts = [];
  //             tmp.contacts.push("z" + cusViewNode.key + "$" + cusViewNode.logic + "$" + res2.data);
  //             this.gaddees.push(tmp);
  //             tmp.len = res2.data;
  //           } else {
  //             this.dialogService.notification.error("错误", res1.errorMsg || res2.errorMsg);
  //           }
  //           if (ncount === 0) {
  //             this.isLoaded = false;
  //           }
  //         },
  //         () => {
  //           this.isLoaded = false;
  //         },
  //       );
  //     });
  //   }
  // }

  // 添加已选
  addAllCusViews(): void {
    if (!this.gaddees || this.gaddees.length < 1) {
      this.dialogService.notification.warning("提示", "没有勾选中任何数据");
      return;
    }
    let gs = "";
    this.gaddees.forEach(g => {
      if (g.len > 0) {
        let temp = new Addressee();
        temp.id = new Date().getTime();
        let s = this.selectAddress.find(o => o.id === temp.id);
        if (s) {
          temp.id = new Date().getTime();
          while (s.id === temp.id) {
            temp.id = new Date().getTime();
          }
        }
        temp.name = g.name;
        temp.len = g.len;
        temp.contacts = g.contacts;
        this.selectAddress.push(temp);
        this.okSelect = true;
      } else {
        gs += "【" + g.name + "】";
      }
    });
    if (gs) {
      this.dialogService.notification.warning("提示", gs + "没有数据");
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

  handleCancel(): void {
    this.modal.destroy();
  }

  handleOk(): void {
    if (this.selectAddress instanceof Array && this.selectAddress.length > 0) {
      this.selectAddress.map(item => (item.icon = this.iconImg3));
      this.modal.close(this.selectAddress);
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
}
