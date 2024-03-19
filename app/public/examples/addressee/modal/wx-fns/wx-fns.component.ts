import { Component, OnInit, ViewChild } from "@angular/core";
import { STColumn, STReq, STRequestOptions, STRes } from "@delon/abc/st";
import { SFComponent, SFSchema, SFUISchema } from "@delon/form";
import { _HttpClient } from "@delon/theme";
import { deepCopy } from "@delon/util";
import { URLS } from "@shared/constant/interface";
import { DialogService } from "@icc/common-lib";
import { NzModalRef } from "ng-zorro-antd/modal";
import {
  NzFormatEmitEvent,
  NzTreeComponent,
  NzTreeNode,
  NzTreeNodeOptions,
} from "ng-zorro-antd/tree";
import { tap } from "rxjs/operators";
import { Addressee } from "src/app/routes/message/Addressee";

@Component({
  selector: "app-wx-fns",
  templateUrl: "./wx-fns.component.html",
  styleUrls: ["./wx-fns.component.less"],
})
export class WxFnsComponent implements OnInit {
  constructor(
    private dialogService: DialogService,
    private http: _HttpClient,
    private modal: NzModalRef
  ) {}

  loading = false;

  // 微信粉丝
  @ViewChild("wechatFanslist", { static: false })
  nzTreeComponent: NzTreeComponent;
  wtags: NzTreeNodeOptions[] = [];
  defaultSelectedTag: any[] = []; // 默认选中的微信公众号节点
  defaultExpandedTag: any[] = [];

  /** 是否可选(只有微信预发送有) */
  @Input() showFansCheckbox = false;

  // 用户选择的收信人列表
  selectAddress: Addressee[] = [];

  ui: SFUISchema = {
    $phone: {
      widget: "string",
      width: 205,
    },
    $name: {
      widget: "string",
      width: 160,
    },
  };

  @ViewChild("wxFans", { static: false }) wxFans: SFComponent;
  // 搜索schema
  searchWxFansSchema: SFSchema = {
    properties: {
      openId: {
        type: "string",
        title: "OpenId",
        ui: {
          placeholder: "请输入完整的openId",
        },
      },
      state: {
        type: "string",
        title: "状态",
        enum: [
          { label: "全部", value: -1 },
          { label: "关注", value: 0 },
          { label: "黑名单", value: 1 },
        ],
        default: -1,
        ui: {
          width: 180,
          widget: "select",
        },
      },
    },
  };

  // 粉丝弹窗表格
  @ViewChild("fanst", { static: false }) fanst: any;
  fansColumns: STColumn[] = [
    {
      title: "编号",
      index: "id.value",
      type: "checkbox",
      iif: () => this.showFansCheckbox,
    },
    // {
    //   title: '昵称',
    //   index: 'nickName',
    //   width: 100,
    // },
    {
      title: "OPENID",
      index: "openId",
      width: 300,
    },
    {
      title: "性别",
      index: "sex",
      default: "/",
      render: "templ-sex",
    },
    {
      title: "所在省",
      index: "province",
      default: "/",
      render: "templ-province",
    },
    {
      title: "所在市",
      index: "city",
      default: "/",
      render: "templ-city",
    },
  ];
  wres: STRes = {
    process: (data, rawData) => {
      // this._groupLen = rawData.total;
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

  // 微信粉丝表格数据
  wechatFansUrl = URLS.wechatFansList.url;

  _groupLen: number;
  _groupId: string;
  _groupName: string;
  _officialAccountId: string;
  okSelect = false;

  addressees: Array<any> = [];

  // 当前微信公众号的通道ID
  @Input() wechatChannelId: number;

  ngOnInit(): void {
    this._groupId = "";
    this.getWechatFansGroup();
  }

  getWechatFansGroup() {
    this.wtags = [];
    this.loading = true;
    this.http
      .get(URLS.wechatFansGroupNode.url + "/" + this.wechatChannelId)
      .pipe(tap(() => (this.loading = false)))
      .subscribe(
        (res) => {
          if (res.status === 0 && res.data) {
            const fansGroup = res.data;
            // fansGroup.expanded = true;
            this.wtags = [];
            this.wtags.push(deepCopy(fansGroup));
            this._officialAccountId = fansGroup.officialAccountId;
            this._groupName = fansGroup.title;
            this.defaultExpandedTag = [];
            this.defaultExpandedTag.push(fansGroup.key);
            this.defaultSelectedTag = [];
            this.defaultSelectedTag.push(fansGroup.key);

            let params: any = {
              state: "0",
              officialAccountId: fansGroup.officialAccountId,
            };
            this.getWechatFansListCount(params);

            if (this.showFansCheckbox) {
              delete params.state;
            }
            this.fanst.reset({ params });
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

  getWechatFansListCount(params) {
    this.http.post(URLS.wechatFansListCount.url, params).subscribe(
      (res) => {
        this._groupLen = res.data;
      },
      (err) => {}
    );
  }

  // 点击微信标签节点
  tagEvent(event: NzFormatEmitEvent): void {
    const tmps: NzTreeNode[] = this.nzTreeComponent.getSelectedNodeList();
    if (!tmps || tmps.length === 0) {
      // 没选中任何节点，当前节点则继续显示选中
      this.defaultSelectedTag = [];
      this.defaultSelectedTag.push(event.node?.key);
      return;
    }
    if (event.node && event.node.origin) {
      this._groupId = "";
      this._groupName = "";
      this._groupLen = 0;
      this._officialAccountId = "";
      let tag = event.node.origin;
      if (event.node.origin.title.lastIndexOf("(") !== -1) {
        this._groupName = tag.title.substring(
          0,
          event.node.origin.title.lastIndexOf("(")
        );
      } else {
        this._groupName = tag.title;
      }
      this._officialAccountId = tag.officialAccountId;

      let params: any = {
        state: "0",
        officialAccountId: tag.officialAccountId + "",
      };

      if (this.showFansCheckbox) {
        delete params.state;
      }

      if (tag.isLeaf) {
        this._groupId = tag.tagId;
        params.tagId = tag.tagId;
        this.fanst.reset({ params });
        this.getWechatFansListCount(params);
      } else {
        this.fanst.reset({ params });
        this.getWechatFansListCount(params);
      }
    }
  }

  /** 条件搜索微信粉丝 */
  searchWxFansList() {
    const { state, openId } = this.wxFans.value;
    let params = {
      openId: openId,
      state: state,
      tagId: this._groupId,
      officialAccountId: this._officialAccountId,
    };
    this.fanst.reset({ params });
    this.getWechatFansListCount(params);
  }

  resetWxFansList() {
    this.wxFans.reset();
    const { state, openId } = this.wxFans.value;
    let params = {
      openId: openId,
      state: state,
      tagId: this._groupId,
      officialAccountId: this._officialAccountId,
    };
    this.fanst.reset({ params });
    this.getWechatFansListCount(params);
  }

  /* 添加全部 */
  addAllTags(): void {
    // 特殊微信粉丝群 -- 预发送专属
    if (this.showFansCheckbox) {
      const checkList = this.fanst._data.filter((v) => v.checked);
      checkList.forEach((it) => {
        if (!this.selectAddress.some((p) => p.openId === it.openId)) {
          this.selectAddress.push(it);
          return;
        }
      });
    } else {
      // 普通微信粉丝群
      if (!this._groupLen || !this._groupName) {
        return;
      }
      if (this._groupLen < 1) {
        this.dialogService.notification.warning("提示", "该标签为空");
        return;
      }
      let temp = new Addressee();
      temp.contacts = [];
      temp.id = new Date().getTime();
      temp.name = this._groupName;
      // 显示为分组中人数大于0的数目
      temp.len = this.getTagsNum();
      // 微信标签发送
      let c = "w" + this._groupId;
      if (this._officialAccountId) {
        c = c + "$" + this._officialAccountId;
      }
      // alert(c);
      temp.contacts.push(c);
      this.selectAddress.push(temp);
    }
    if (this.selectAddress.length > 0) {
      this.okSelect = true;
    }
  }

  // 显示包含的标签数，如果是叶子节点，就显示1
  getTagsNum() {
    if (!this.wtags || !this.wtags.length) {
      return 0;
    }
    let selectedItem: any = null;
    const fn = (nodes) => {
      for (let item of nodes) {
        if (item.tagId === this._groupId) {
          selectedItem = item;
          break;
        }
        if (item.children) {
          fn(item.children);
        }
      }
    };
    if (!this._groupId) {
      selectedItem = this.wtags[0];
    } else {
      fn(this.wtags);
    }
    if (!selectedItem) {
      return 0;
    }
    if (!selectedItem.children) {
      return 1;
    }
    return selectedItem.children.filter((item) => {
      const matches = item.title.match(/\(\d+\)/);
      if (matches) {
        return +matches[0].slice(1, -1) > 0;
      }
      return false;
    }).length;
  }

  // 弹窗页面tag删除事件
  onTagClose2(event) {
    let x;
    // 特殊微信粉丝群 -- 预发送专属
    if (this.showFansCheckbox) {
      x = this.selectAddress.findIndex((obj) => obj.openId === event.openId);
    } else {
      // 普通微信粉丝
      x = this.selectAddress.findIndex((obj) => obj.id === event.id);
    }
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
      this.modal.close(this.selectAddress);
    }
  }
}
