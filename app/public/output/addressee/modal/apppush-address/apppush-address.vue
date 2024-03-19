<template>
<section><div class="modal-header-update">
  <div class="modal-title">AppPush用户</div>
</div>

<div class="modal-row">
  <a-tabset :tab-bar-gutter="0" class="modal-column-1">
    <a-tab-pane tab="AppPush用户">
      <a-spin tip="加载中..." :spinning="loading">
        <div class="tree-box" style="padding-top: 20px">
          <ul class="appPush-account-wrapper">
            <li class="appPush-account-item" :class="{ active: i === actIndex }" v-for="(item, i) in appPushAccounts" @click="(e) => getFans(item,i)">
              <a-tooltip :title="item.name" placement="top">
<span class="appPush-item-span">
                {{ item.name }}
              </span>
</a-tooltip>
            </li>
          </ul>
        </div>
      </a-spin>
    </a-tab-pane>
  </a-tabset>
  <div class="modal-column-2">
    <form :layout="'inline'">
      <a-row :gutter="{ xs: 8, sm: 8, md: 8, lg: 24, xl: 48, xxl: 48 }">
        <a-col md="8" sm="24">
          <a-form-item html-for="nickname" label="RegId" :name="['xwRegId']">
              <a-input v-model:value="appPushSearchOptions.xwRegId" name="xwRegId" placeholder="请输入完整的RegId" maxlength="50"></a-input>
            </a-form-item>
        </a-col>
        <a-col md="8" sm="24">
          <a-form-item label="手机厂商" :name="['brand']">
              <a-form-control>
                <a-input v-model:value="appPushSearchOptions.brand" name="brand" placeholder="请输入完整的手机厂商" maxlength="50"></a-input>
              </a-form-control>
            </a-form-item>
        </a-col>
        <a-col md="8" sm="24" v-if="expandForm">
          <a-form-item label="在线状态" :name="['status']">
              <a-select v-model:value="appPushSearchOptions.status" name="status" :placeholder="'请选择在线状态'" :show-search="true" option-label-prop="children" option-filter-prop="label">
                <a-select-option v-for="(state, idx ) in statusList" :label="state.label" :value="state.value"></a-select-option>
              </a-select>
            </a-form-item>
        </a-col>
        <a-col md="8" sm="24" v-if="expandForm">
          <a-form-item label="别名" :name="['alias']">
              <a-input v-model:value="appPushSearchOptions.alias" name="alias" placeholder="请输入完整的别名" maxlength="40"></a-input>
            </a-form-item>
        </a-col>
        <a-col :span="expandForm ? 16 : 8" :class.text-right="expandForm" class="search-btns" :style="{
            'justify-content': expandForm ? 'flex-end' : 'flex-start'
          }">
          <icc-button :btn-type="'default'" @btnClick="getTableList">
            <span>查询</span>
          </icc-button>
          <icc-button :btn-type="'hollow'" @btnClick="resetTableList">
            <span>重置</span>
          </icc-button>
          <a class="expand-box" @click="expandForm = !expandForm" style="margin-left: 0">
            {{ expandForm ? "收起" : "展开" }}
            <icc-arrow :expand="expandForm"></icc-arrow>
          </a>
        </a-col>
      </a-row>
    </form>
    <icc-dynamic-table ref="appPushViewSt" :scroll="{ x: '730px' }" :data="appPushAddressUrl" :columns="appPushViewCols" :res="appPushRes" :req="req" @change="appPushstChange">
      <template #tpl-regid="item">
        <icc-table-text :text="item.xwRegId" :width="190"></icc-table-text>
      </template>
      <template #tpl-alias="item">
        <icc-table-text :text="item.alias" :width="150"></icc-table-text>
      </template>
    </icc-dynamic-table>
  </div>
  <div class="modal-column-3">
    <icc-button :btn-type="'default'" @btnClick="addAllAppPush">
      <span>添加全部</span>
    </icc-button>
    <icc-button :btn-type="'default'" @btnClick="addSelectedAppPush">
      <span>添加已选</span>
    </icc-button>
  </div>
  <div class="modal-column-4">
    <p class="box-title">已选收信人</p>
    <div class="list-box">
      <template v-for="item in selectAddress">
        <app-selected :text="item.name" :count="item.len" @delete="(e) => onTagClose2(item)"></app-selected>
      </template>
    </div>
  </div>
</div>

<div class="modal-footer modal-footer-update">
  <icc-button :btn-type="'hollow'" @btnClick="handleCancel">
    <span>取消</span>
  </icc-button>
  <icc-button :btn-type="'default'" @btnClick="handleOk" :is-disabled="!okSelect">
    <span>确定</span>
  </icc-button>
</div></section>
</template>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import { AppPushUser } from "src/app/routes/message/AppPushUser";
import { Addressee } from "src/app/routes/message/Addressee";
import { URLS } from "@shared/constant/interface";
import { DynamicTableInstance, Req, Res, TableColumn } from "@icc/components/icc-dynamic-table";
import { useNotification } from "@icc/hooks";
import { http } from "@icc/api";

const dialogService = useNotification();

defineOptions({
	name: 'AppApppushAddress',
});

const props = defineProps({
	appId: {
	default: () => ("")
	},
});
const emits = defineEmits(["close"]);
let _groupLen: number;
let appPushChannelId = null;
let _groupName: string;
let _regId = "";
let _brand = "";
let _status = "";
let _alias = "";
let appPushViewSt: DynamicTableInstance;
let selectedRows: any[] = [];
let addee: Addressee = new Addressee();
let selectCount = 0;
let appPushUsers: AppPushUser[] = [];
let records: Addressee[] = [];
let _deptId = "-1";
let iconImg4 = "./assets/images/msgType/jpush.png";
const loading = ref(false);
const actIndex = ref<any>(null);
const appPushAccounts = ref<any[]>([]);
const expandForm = ref(false);
const statusList = ref([
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
  ]);
const appPushAddressUrl = ref(URLS.appPushFansList.url);
const appPushViewCols = ref<TableColumn[]>([
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
  ]);
const selectAddress = ref<Addressee[]>([]);
const okSelect = ref(false);
const appPushSearchOptions = reactive<any>({
    channelId: -1,
    xwRegId: "",
    brand: "",
    alias: "",
    status: -1,
  });
const appPushRes = reactive<Res>({
    process: (data, rawData) => {
      _groupLen = rawData.total;
      return data;
    },
  });
const req = reactive<Req>({
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
    process: (requestOptions: any) => {
      return requestOptions;
    },
  });

function ngOnInit() {
    getAppPushAccounts();
    selectAddress.value = [];
    _groupName = "AppPush收信人";
    okSelect.value = false;
  }
ngOnInit();

function getTableList() {
    _regId = appPushSearchOptions.xwRegId;
    _brand = appPushSearchOptions.brand;
    _status = appPushSearchOptions.status;
    _alias = appPushSearchOptions.alias;
    appPushViewSt.reset({
      params: {
        id: appPushSearchOptions.channelId,
        xwRegId: appPushSearchOptions.xwRegId,
        brand: appPushSearchOptions.brand,
        status:
          appPushSearchOptions.status === -1
            ? null
            : appPushSearchOptions.status,
        alias: appPushSearchOptions.alias,
      },
    });
  }

function resetTableList() {
    // 重置搜索条件
    appPushSearchOptions.xwRegId = "";
    appPushSearchOptions.brand = "";
    appPushSearchOptions.status = -1;
    appPushSearchOptions.alias = "";

    // 重新加载table数据
    getTableList();
  }

function getFans(item, itemIdx) {
    actIndex.value = itemIdx;
    appPushSearchOptions.channelId = item.appId;
    appPushChannelId = item.appId;
    _groupName = item.name;
    resetTableList();
  }

function appPushstChange(e: any) {
    switch (e.type) {
      case "checkbox":
        selectedRows = e.checkbox!;
        addee = null!;
        let temp = new Addressee();
        let len = selectedRows.length;
        selectCount = len;
        if (len > 0) {
          appPushUsers = [];
          addee = new Addressee();
          addee.contacts = [];
          addee.len = len;
          if (_groupName) {
            addee.name = _groupName;
          }
        }
        for (let row of selectedRows) {
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
          addee.contacts.push(contact);
          appPushUsers.push(appPushUser);
        }
        temp.len = len;
        temp.name = _groupName;
        let c = true;
        records = records.filter((item) => {
          if (item.name === temp.name) {
            c = false;
            item.len = len;
          }
          return !(item.name === temp.name && len === 0);
        });
        if (c && len > 0) {
          records.push(temp);
        }
        break;
      case "filter":
        console.log(e);
        break;
      case "pi":
        selectedRows = [];
        break;
    }
  }

function addAllAppPush() {
    if (!_groupLen || _groupLen < 1) {
      dialogService.notification.warning("提示", "该分组没有数据");
      return;
    }
    let temp = new Addressee();
    temp.contacts = [];
    temp.id = new Date().getTime();
    temp.name = _groupName;
    temp.len = _groupLen;
    if ("-1" === _deptId) {
      _deptId = appPushAccounts.value[0].id;
    }
    let c =
      "i" +
      (_regId || "") +
      "$" +
      (_brand || "") +
      "$" +
      (_status || "") +
      "$" +
      (_alias || "") +
      "$" +
      appPushChannelId +
      "$";
    temp.contacts.push(c);
    selectAddress.value.push(temp);
    okSelect.value = true;
  }

function addSelectedAppPush() {
    if (!addee || addee.len < 1) {
      dialogService.notification.warning("提示", "没有勾选中任何数据");
      return;
    }
    if (addee && addee.len > 0) {
      let temp = new Addressee();
      temp.id = new Date().getTime();
      temp.name = addee.name;
      temp.len = addee.len;
      temp.contacts = addee.contacts;
      // alert(temp.contacts);
      selectAddress.value.push(temp);
      okSelect.value = true;
    }
  }

function onTagClose2(event) {
    let x = selectAddress.value.findIndex((obj) => obj.id === event.id);
    selectAddress.value.splice(x, 1);
    if (selectAddress.value && selectAddress.value.length < 1) {
      okSelect.value = false;
    }
  }

function handleCancel() {
    emits('close');
  }

function handleOk() {
    if (selectAddress.value instanceof Array && selectAddress.value.length > 0) {
      selectAddress.value.map((item) => (item.icon = iconImg4));
      emits('close', selectAddress.value);
    }
  }

function getAppPushAccounts() {
    loading.value = true;
    http.post(URLS.appPushAppList.url, {}).then((res) => {
      loading.value = false;
      if (res.status === 0 && res.data.length > 0) {
        appPushAccounts.value = res.data.filter((item) => {
          return item.appId === props.appId;
        });
        appPushSearchOptions.channelId = appPushAccounts.value[0].appId;
        appPushChannelId = appPushAccounts.value[0].appId;
        _groupName = appPushAccounts.value[0].name;
        actIndex.value = 0;
        resetTableList();
      }
    });
  }
</script>
<style lang="less" scoped>
.modal-row {
	display: flex;
	min-height: 420px;
    max-height: 550px;

	.modal-column-1,
	.modal-column-4 {
		display: flex;
		flex-direction: column;
		border: 1px solid #eaecf0;
		width: 220px;

		.box-title {
			box-sizing: border-box;
			margin: 0;
			padding: 0 20px;
			border-bottom: 1px solid #eaecf0;
			height: 60px;
			line-height: 60px;
			font-size: 18px;
			color: #49536e;
		}

		.tree-box {
			overflow: auto;
			flex: 1;
			margin-top: 0;
			padding: 0 0 5px 0;
			width: 100%;
			height: auto;
			max-height: 374px;
		}

		.list-box {
			overflow: auto;
			flex: 1;
			padding: 0 10px;
			width: 100%;
			height: 100%;
		}
	}

	.modal-column-2 {
		border: 1px solid #eaecf0;
		border-left: 0;
		width: 740px;
		overflow-y: auto;

		.form-box {
			position: relative;
			margin-bottom: -28px;
			padding-right: 150px;

			.btn-search {
				position: absolute;
				right: 80px;
				top: 13px;
			}

			.btn-cancel {
				position: absolute;
				right: 10px;
				top: 13px;
			}
		}

		.my-md {
			margin-left: 10px;
			margin-right: 10px;
		}
	}

	.modal-column-3 {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border: 0;
		width: 120px;
		icc-button {
			margin: 8px 0;
		}
		.add-all-btn-cls {
			border-color: rgb(55, 186, 157);
			background-color: rgb(55, 186, 157);
			color: rgb(255, 255, 255);
			&:hover {
				border-color: #45c9ac;
				background-color: #45c9ac;
			}
		}
	}

	.modal-column {
		border: 1px solid #eaecf0;
		height: 100%;
	}
}

.appPush-account-wrapper {
	overflow: auto;
	margin: 0;
	padding: 0;
	max-height: 360px;
}

.appPush-account-item {
	list-style: none;
	margin: 5px;
	padding: 0 20px;
	border-radius: 5px;
	height: 36px;
	cursor: pointer;
	line-height: 36px;
	transition: background-color .5s;
	.appPush-item-span {
		display: inline-block;
		overflow: hidden;
		max-width: 195px;
		height: 36px;
		cursor: pointer;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	&:hover {
		background-color: #f5f5f5;
	}
	&.active {
		background-color: rgba(190, 229, 249, .9);
	}
}
</style>