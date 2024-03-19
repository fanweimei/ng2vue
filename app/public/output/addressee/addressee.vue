<template>
<template v-if="addressBtnList.length">
  <p class="box-title">收信人</p>
  <div class="btn-group">
    <img v-for="btnItem in addressBtnList" src="./assets/images/send/{{ btnItem.icon }}" title="{{ btnItem.zh_name }}" @click="(e) => addressBtnClick(btnItem.modalType)" />
  </div>
  <div class="select-list">
    <app-selected v-for="(item, i ) in addressees" :icon-img="item.icon" :text="item.name" :count="item.len" :hidden="hadSelectAutoTemplate && item.isWxFns" @delete="(e) => onTagClose(i)"></app-selected>
  </div>
</template>

</template>
<script lang="ts" setup>
import { computed, PropType, ref, watchEffect } from "vue";
import { forkJoin, Observable } from "rxjs";
import { StandardMessageHelperImpl, useMsgconfHelperService, useMsgService } from "@icc/msg";
import { http } from "@icc/api";
import { useModal, useNotification } from "@icc/hooks";
import FileImport from "./modal/file-import/file-import.vue";
import Commcenter from "./modal/commcenter/commcenter.vue";
import Customer from "./modal/customer/customer.vue";
import ApppushAddress from "./modal/apppush-address/apppush-address.vue";
import WorkwxAddress from "./modal/workwx-address/workwx-address.vue";
import WxFns from "./modal/wx-fns/wx-fns.vue";
import TextImportModal from "./modal/text-import/text-import.vue";

const [ modalHelper ] = useModal();
const dialogService = useNotification();
const messageService = useMsgService();
const confhelperService = useMsgconfHelperService();

defineOptions({
	name: 'AppAddressee',
});

const props = defineProps({
	addressees: {
	type: Object as PropType<Array<any>>,
		default: () => ([])
	},
	selectedValue: {
	type: Object as PropType<any>,
	},
	hadSelectAutoTemplate: {
	type: Boolean,
	},
	isGroupWay: {
	type: Boolean,
	},
	showFansCheckbox: {
	type: Boolean,
		default: false
	},
});
const emits = defineEmits(["update:addressees","getdata","showchange"]);
let account: number = 0;
let appId: string = "";
let wechatChannelId: number;
let workwxAppId: string = "";
let isOfficialSubscribeType: boolean;
const addressBtnList = ref<any[]>([]);
const addressees = computed({
	get() {
		return props.addressees;
	},
	set(value) {
		emits('update:addressees', value);
	}
});

watchEffect(() => {
    if (props.selectedValue && props.selectedValue && props.selectedValue.bizTypes instanceof Array) {
      updateChannelInfo(msgInsList => {
        setAddressButtons(msgInsList);
      });
      clearAddress();
    }
  })

function verifyRecieveCount(totalCount: number, addressees: { len: number }[], addAddress?: { len: number }) {
    let recieveCount = 0;
    if (addAddress instanceof Array) {
      addAddress.forEach(item => {
        recieveCount += item.len;
      });
    }
    if (addAddress) recieveCount += addAddress.len;

    return recieveCount <= totalCount;
  }

function clearAddress() {
    addressees.value.splice(0, addressees.value.length);
    account = 0;
    if (!props.showFansCheckbox) {
      sessionStorage.removeItem("cloneAddress");
    }
  }

function addressBtnClick(modalType: string, showFansCheckbox?: boolean) {
    switch (modalType) {
      case "communication":
        modalHelper.createStatic(Commcenter, {}, {
      size: 1340,
		onOk: res => {
          addressees.value = [...addressees.value, ...res];
          emits('getdata', addressees.value);
        }
    });
        break;
      case "customer":
        modalHelper.createStatic(Customer, {}, {
      size: 1340,
		onOk: res => {
          addressees.value = [...addressees.value, ...res];
          emits('getdata', addressees.value);
        }
    });
        break;
      case "import":
        if (!verifyRecieveCount(50000000, addressees.value)) {
          dialogService.error("提示", "收信人总数不可超过5000万！");
          return;
        }
        modalHelper.createStatic(FileImport, {}, {
      size: "md",
		onOk: res => {
          if (!res || !res.len) return;
          let errorMsg;
          if (account >= 50) {
            errorMsg = "最多只可允许上传50个文件！";
          }
          if (!verifyRecieveCount(50000000, addressees.value, res)) {
            errorMsg = "收信人总数不可超过5000万！";
          }
          if (errorMsg) {
            dialogService.error("提示", errorMsg);
            return;
          }

          addressees.value.push(res);
          account++;
          emits('getdata', addressees.value);
        }
    });
        break;
      case "clear":
        clearAddress();
        break;
      case "appPush-users":
        modalHelper.createStatic(ApppushAddress, { appId: appId }, {
      size: 1340,
		onOk: res => {
          addressees.value = [...addressees.value, ...res];
          emits('getdata', addressees.value);
        }
    });
        break;
      case "wechat-fns":
        modalHelper.createStatic(WxFns, { wechatChannelId: wechatChannelId, showFansCheckbox }, {
      size: 1340,
		onOk: res => {
          res.map(item => (item.isWxFns = true));
          addressees.value = [...addressees.value, ...res];
          emits('getdata', addressees.value);
        }
    });
        break;
      case "workwx-book":
        modalHelper.createStatic(WorkwxAddress, { workwxAppId: workwxAppId }, {
      size: 1340,
		onOk: res => {
          addressees.value = [...addressees.value, ...res];
          emits('getdata', addressees.value);
        }
    });
        break;
      case "text-import":
        modalHelper.createStatic(TextImportModal, {}, {
      		onOk: res => {
          addressees.value = [...addressees.value, res];
          emits('getdata', addressees.value);
        }
    });
      default:
        break;
    }
  }

function onTagClose(index: number) {
    if (index >= 0 && index < addressees.value.length) {
      addressees.value.splice(index, 1);
      account--;
      if (!props.showFansCheckbox) {
        sessionStorage.setItem("cloneAddress", JSON.stringify(addressees.value));
      }
    }
  }

function updateChannelInfo(callback: Function) {
    const instanceList: any[] = [];
    const observableList: any[] = [];

    // 清空渠道信息
    isOfficialSubscribeType = false;
    workwxAppId = "";
    wechatChannelId = undefined!;
    appId = "";

    for (let entry of props.selectedValue.bizTypes) {
      Object.keys(entry).map(typeStr => {
        const standardMessageIns = confhelperService.getStandardMessageHelperInstance(+typeStr);
        const reqObser: Observable<any> | boolean = standardMessageIns?.requrestChannelInfo
          ? standardMessageIns.requrestChannelInfo(http, props.selectedValue.id)
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
          wechatChannelId = (instanceList.find(_ins => _ins.hasOwnProperty("wechatChannelId")) || {}).wechatChannelId;
          isOfficialSubscribeType = (instanceList.find(_ins => _ins.hasOwnProperty("isOfficialSubscribeType")) || {}).isOfficialSubscribeType;
          workwxAppId = (instanceList.find(_ins => _ins.hasOwnProperty("workwxAppId")) || {}).workwxAppId;
          appId = (instanceList.find(_ins => _ins.hasOwnProperty("appId")) || {}).appId;

          callback(instanceList);
          
        },
        err => {
          console.log(err, 998);
        },
      );
    } else {
      callback(instanceList);
      
    }
  }

function setAddressButtons(msgInsList: Array<StandardMessageHelperImpl>) {
    // 如果有消息类型不存在清空按钮，则不显示所有的按钮
    let hasEmptyClear = false;
    // 如果有消息类型不存在公共按钮组，则不显示公共按钮组
    let hasEmptyCommon = false;
    // exist消息类型计数
    let existCount: number = 0;

    let _cacheBtns: any = { common: null, add: null, clear: null, single: null, exist: null };

    msgInsList.forEach(insItem => {
      const itemCollection = insItem?.getAddresseeOperateButtons(props.selectedValue.ignoreAudit, props.isGroupWay);
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
    addressBtnList.value = tempArray;

    // 按钮组为空时，则判断为不显示收信人，事件通知父组件，父组件上的操作则忽略对该组件的相关逻辑
    emits('showchange', !!tempArray.length);
  }
</script>
<style lang="less" scoped>
.box-title {
  margin: 0;
  padding: 10px 20px;
  font-size: 18px;
}

.btn-group {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 10px 10px 20px;
  border-bottom: 1px solid #eaecf0;

  img {
    margin-right: 20px;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.select-list {
  overflow: auto;
  flex: 1;
  padding: 10px 20px 20px;
  max-height: 400px;
}
</style>