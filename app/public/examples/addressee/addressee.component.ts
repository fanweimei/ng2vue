import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, EventEmitter, Output, OnDestroy } from "@angular/core";
import { ModalHelper, _HttpClient } from "@delon/theme";
import { forkJoin, Observable } from "rxjs";
import { MessageService, DialogService, MsgconfHelperService, StandardMessageHelperImpl } from "@icc/common-lib";
import { FileImportComponent } from "./modal/file-import/file-import.component";
import { CommcenterComponent } from "./modal/commcenter/commcenter.component";
import { CustomerComponent } from "./modal/customer/customer.component";
import { ApppushAddressComponent } from "./modal/apppush-address/apppush-address.component";
import { WorkwxAddressComponent } from "./modal/workwx-address/workwx-address.component";
import { WxFnsComponent } from "./modal/wx-fns/wx-fns.component";
import { TextImportModalComponent } from "./modal/text-import/text-import.component";

@Component({
  selector: "app-addressee",
  templateUrl: "./addressee.component.html",
  styleUrls: ["./addressee.component.less"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddresseeComponent implements OnChanges {
  constructor(
    private modalHelper: ModalHelper,
    private http: _HttpClient,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confhelperService: MsgconfHelperService,
  ) {}
  // 收信人列表
  @Input() addressees: Array<any> = [];
  // 当前业务模板
  @Input() selectedValue: any;
  // 是否使用自动模板匹配
  @Input() hadSelectAutoTemplate: boolean;
  // 是否是群发消息
  @Input() isGroupWay: boolean;
  // 是否可选(只有微信预发送有)
  @Input() showFansCheckbox = false;

  // 数据回调
  @Output() getdata: EventEmitter<any> = new EventEmitter<any>();
  // 收信人显隐事件
  @Output() showchange: EventEmitter<boolean> = new EventEmitter<boolean>();

  addressBtnList: any[] = [];
  isOfficialSubscribeType: boolean;
  // 当前微信公众号的appId
  // 当前企业微信的appId
  workwxAppId = "";
  // 当前appPush appid
  appId = "";
  // 当前微信公众号的通道ID
  wechatChannelId: number;
  account = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedValue && this.selectedValue && this.selectedValue.bizTypes instanceof Array) {
      this.updateChannelInfo(msgInsList => {
        this.setAddressButtons(msgInsList);
      });
      this.clearAddress();
    }
  }

  // 切换业务模板，更新渠道信息
  updateChannelInfo(callback: Function) {
    const instanceList: any[] = [];
    const observableList: any[] = [];

    // 清空渠道信息
    this.isOfficialSubscribeType = false;
    this.workwxAppId = "";
    this.wechatChannelId = undefined!;
    this.appId = "";

    for (let entry of this.selectedValue.bizTypes) {
      Object.keys(entry).map(typeStr => {
        const standardMessageIns = this.confhelperService.getStandardMessageHelperInstance(+typeStr);
        const reqObser: Observable<any> | boolean = standardMessageIns?.requrestChannelInfo
          ? standardMessageIns.requrestChannelInfo(this.http, this.selectedValue.id)
          : false;

        if (typeof reqObser !== "boolean") {
          observableList.push(reqObser);
        }
        instanceList.push(standardMessageIns);
      });
    }

    if (observableList.length) {
      forkJoin(...observableList).subscribe(
        () => {
          this.wechatChannelId = (instanceList.find(_ins => _ins.hasOwnProperty("wechatChannelId")) || {}).wechatChannelId;
          this.isOfficialSubscribeType = (instanceList.find(_ins => _ins.hasOwnProperty("isOfficialSubscribeType")) || {}).isOfficialSubscribeType;
          this.workwxAppId = (instanceList.find(_ins => _ins.hasOwnProperty("workwxAppId")) || {}).workwxAppId;
          this.appId = (instanceList.find(_ins => _ins.hasOwnProperty("appId")) || {}).appId;

          callback(instanceList);
          this.cdr.detectChanges();
        },
        err => {
          console.log(err, 998);
        },
      );
    } else {
      callback(instanceList);
      this.cdr.detectChanges();
    }
  }

  // 根据渠道信息和消息类型，动态显示收信人操作按钮
  setAddressButtons(msgInsList: Array<StandardMessageHelperImpl>) {
    // 如果有消息类型不存在清空按钮，则不显示所有的按钮
    let hasEmptyClear = false;
    // 如果有消息类型不存在公共按钮组，则不显示公共按钮组
    let hasEmptyCommon = false;
    // exist消息类型计数
    let existCount: number = 0;

    let _cacheBtns: any = { common: null, add: null, clear: null, single: null, exist: null };

    msgInsList.forEach(insItem => {
      const itemCollection = insItem?.getAddresseeOperateButtons(this.selectedValue.ignoreAudit, this.isGroupWay);
      if (!itemCollection.common || !itemCollection.common.length) {
        hasEmptyCommon = true;
      }
      if (!itemCollection.clear) {
        hasEmptyClear = true;
      }
      if (!_cacheBtns.common && itemCollection.common && itemCollection.common.length) {
        _cacheBtns.common = itemCollection.common;
      }
      if (itemCollection.add && itemCollection.add.length) {
        !_cacheBtns.add ? (_cacheBtns.add = itemCollection.add) : (_cacheBtns.add = _cacheBtns.add.concat(itemCollection.add));
      }
      if (!_cacheBtns.clear && itemCollection.clear) {
        _cacheBtns.clear = itemCollection.clear;
      }
      if (itemCollection.single && itemCollection.single.length) {
        !_cacheBtns.single ? (_cacheBtns.single = itemCollection.single) : (_cacheBtns.single = _cacheBtns.single.concat(itemCollection.single));
      }
      if (itemCollection.exist && itemCollection.exist.length) {
        existCount++;
        // modalType相同的情况下，不重复导入
        _cacheBtns.exist
          ? !itemCollection.exist.some(item => {
              return _cacheBtns.exist.some(exist => item.modalType === exist.modalType);
            }) && (_cacheBtns.exist = _cacheBtns.exist.concat(itemCollection.exist))
          : (_cacheBtns.exist = itemCollection.exist);
      }
    });

    let tempArray: any[] = [];
    if (!hasEmptyCommon && _cacheBtns.common && _cacheBtns.common.length) {
      tempArray = [..._cacheBtns.common];
    }
    if (msgInsList.length === 1 && _cacheBtns.single) {
      // 只有一种消息类型存在且single存在时，则只显示common、single、clear
      tempArray = [...tempArray, ..._cacheBtns.single];
    } else if (_cacheBtns.add && _cacheBtns.add.length) {
      tempArray = [...tempArray, ..._cacheBtns.add];
    }
    if (_cacheBtns.exist && existCount === msgInsList.length) {
      tempArray = [...tempArray, ..._cacheBtns.exist];
    }
    if (_cacheBtns.clear) {
      tempArray = [...tempArray, _cacheBtns.clear];
    }
    if (hasEmptyClear) {
      tempArray = [];
    }
    this.addressBtnList = tempArray;

    // 按钮组为空时，则判断为不显示收信人，事件通知父组件，父组件上的操作则忽略对该组件的相关逻辑
    this.showchange.emit(!!tempArray.length);
  }

  // 收信人按钮事件
  addressBtnClick(modalType: string, showFansCheckbox?: boolean) {
    switch (modalType) {
      case "communication":
        this.modalHelper.create(CommcenterComponent, {}, { size: 1340 }).subscribe(res => {
          this.addressees = [...this.addressees, ...res];
          this.getdata.emit(this.addressees);
        });
        break;
      case "customer":
        this.modalHelper.create(CustomerComponent, {}, { size: 1340 }).subscribe(res => {
          this.addressees = [...this.addressees, ...res];
          this.getdata.emit(this.addressees);
        });
        break;
      case "import":
        if (!this.verifyRecieveCount(50000000, this.addressees)) {
          this.dialogService.notification.error("提示", "收信人总数不可超过5000万！");
          return;
        }
        this.modalHelper.create(FileImportComponent, {}, { size: "md" }).subscribe(res => {
          if (!res || !res.len) return;
          let errorMsg;
          if (this.account >= 50) {
            errorMsg = "最多只可允许上传50个文件！";
          }
          if (!this.verifyRecieveCount(50000000, this.addressees, res)) {
            errorMsg = "收信人总数不可超过5000万！";
          }
          if (errorMsg) {
            this.dialogService.notification.error("提示", errorMsg);
            return;
          }

          this.addressees.push(res);
          this.account++;
          this.getdata.emit(this.addressees);
        });
        break;
      case "clear":
        this.clearAddress();
        break;
      case "appPush-users":
        this.modalHelper.create(ApppushAddressComponent, { appId: this.appId }, { size: 1340 }).subscribe(res => {
          this.addressees = [...this.addressees, ...res];
          this.getdata.emit(this.addressees);
        });
        break;
      case "wechat-fns":
        this.modalHelper.create(WxFnsComponent, { wechatChannelId: this.wechatChannelId, showFansCheckbox }, { size: 1340 }).subscribe(res => {
          res.map(item => (item.isWxFns = true));
          this.addressees = [...this.addressees, ...res];
          this.getdata.emit(this.addressees);
        });
        break;
      case "workwx-book":
        this.modalHelper.create(WorkwxAddressComponent, { workwxAppId: this.workwxAppId }, { size: 1340 }).subscribe(res => {
          this.addressees = [...this.addressees, ...res];
          this.getdata.emit(this.addressees);
        });
        break;
      case "text-import":
        this.modalHelper.create(TextImportModalComponent).subscribe(res => {
          this.addressees = [...this.addressees, res];
          this.getdata.emit(this.addressees);
        });
      default:
        break;
    }
  }

  verifyRecieveCount(totalCount: number, addressees: { len: number }[], addAddress?: { len: number }) {
    let recieveCount = 0;
    if (addAddress instanceof Array) {
      addAddress.forEach(item => {
        recieveCount += item.len;
      });
    }
    if (addAddress) recieveCount += addAddress.len;

    return recieveCount <= totalCount;
  }

  // 主页面tag删除事件
  onTagClose(index: number) {
    if (index >= 0 && index < this.addressees.length) {
      this.addressees.splice(index, 1);
      this.account--;
      if (!this.showFansCheckbox) {
        sessionStorage.setItem("cloneAddress", JSON.stringify(this.addressees));
      }
    }
  }

  clearAddress() {
    this.addressees.splice(0, this.addressees.length);
    this.account = 0;
    if (!this.showFansCheckbox) {
      sessionStorage.removeItem("cloneAddress");
    }
  }
}
