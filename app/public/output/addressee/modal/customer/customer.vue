<template>
<section><div class="modal-header-update">
  <div class="modal-title">智能客群</div>
</div>

<div class="tip">仅显示总数统计完毕的智能客群分组，若未出现您需要的分组，请稍后重新打开此页面。</div>

<div class="modal-row">
  <a-tabset :tab-bar-gutter="0" class="modal-column-1">
    <a-tab-pane tab="智能客群">
      <a-spin tip="加载中..." :spinning="loading" style="overflow: auto; height: 355px">
        <div class="tree-box">
          <a-tree ref="customerList" checkable :tree-data="nodes" :expanded-keys="defaultExpandedKeys" :selected-keys="defaultSelectedKeys" @select="cusViewEvent" @check="rowCheckedChange" show-line="true">
            <template #title>
              <span class="ant-tree-title cell-text-ellipsis">{{ node.title }}</span>
            </template>
</a-tree>
        </div>
      </a-spin>
    </a-tab-pane>
  </a-tabset>
  <div class="modal-column-2">
    <icc-dynamic-table ref="customerViewSt" :scroll="{ x: '730px' }" :data="customerViewUrl" :columns="customerViewCols" :res="res" :req="req">
      <template #templ-group="item">
        <icc-multi-line-cell :list="item.groups" :lines="1"></icc-multi-line-cell>
      </template>
      <template #tpl-name="item">
        <icc-table-text :text="item.name" :width="100"></icc-table-text>
      </template>
      <template #tmpl-apppush="item">
        <icc-table-text :text="formatTerminal(item, terminalType.apppush)" :width="100"></icc-table-text>
      </template>
      <template #tmpl-workwx="item">
        <icc-table-text :text="formatTerminal(item, terminalType.workwx)" :width="100"></icc-table-text>
      </template>
      <template #tmpl-wechat="item">
        <icc-table-text :text="formatTerminal(item, terminalType.wechat)" :width="100"></icc-table-text>
      </template>
    </icc-dynamic-table>
  </div>
  <div class="modal-column-3">
    <icc-button :btn-type="'default'" @btnClick="addAllCusViews">
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
import { onMounted, reactive, ref } from "vue";
import { Addressee } from "src/app/routes/message/Addressee";
import { tap } from "rxjs/operators";
import { isJsonString, TERMINALTYPE } from "@icc/utils";
import { URLS } from "@/api/interface";
import { from, Subject, zip } from "rxjs";
import { DynamicTableInstance, Req, Res, TableColumn } from "@icc/components/icc-dynamic-table";
import { useMsgconfHelperService, useMsgService } from "@icc/msg";
import { http } from "@icc/api";
import { useMsgPluginFilterService, useNotification } from "@icc/hooks";

const dialogService = useNotification();
const msgPluginFilterService = useMsgPluginFilterService();
const messageService = useMsgService();
const confhelperService = useMsgconfHelperService();

defineOptions({
	name: 'AppCustomer',
});

const emits = defineEmits(["close"]);
let lastItemIds: any = {};
let curPage: number = 0;
let gaddees: Addressee[] = [];
let iconImg3: string = "./assets/images/btnIcon/kequn.png";
let msgTypes: any;
let msgMap: { [key: string]: any } = {};
const loading = ref<boolean>(false);
const nodes = ref<any[]>([]);
const defaultExpandedKeys = ref(["1"]);
const defaultSelectedKeys = ref(["1"]);
const customerViewUrl = ref(URLS.smartCustomerList.url);
const customerViewCols = ref<TableColumn[]>([
    {
      title: "姓名",
      render: "tpl-name",
      width: 132,
      className: "text-center",
    },
  ]);
const selectAddress = ref<Addressee[]>([]);
const okSelect = ref<boolean>(false);
const customerViewSt = ref<DynamicTableInstance>();
const st = ref<any>();
const res = reactive<Res>({
    process: (data, rawData) => {
      if (data?.length) {
        lastItemIds[curPage] = data[data.length - 1]?.id;
      }
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
      curPage = requestOptions.body.pi;
      let id = curPage > 1 ? lastItemIds[curPage - 1] : null;
      requestOptions.body.params.id = id;
      return requestOptions;
    },
  });

onMounted(() => {
    msgPluginFilterService.msgTypeFilter(msgTypes => {
      getCustomerView();
      msgTypes = msgTypes;
      // 刷新通讯中心和客群的列表
      let msgAddColumns: any[] = [];
      msgTypes.forEach(item => {
        let msgItem = messageService.getMessageConfigByType(item.type);
        if (msgItem) {
          msgMap[item.key] = msgItem;
        }
        const msgIns = confhelperService.getStandardMessageHelperInstance(item.key);
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
      customerViewCols.value = customerViewCols.value.concat(msgAddColumns);
      // 智能客群添加动态列
      st.value? &&
        st.value?.resetColumns({
          columns: customerViewCols.value,
          emitReload: true,
        });
    });
  })

function getTableList(key) {
    if (key !== null && key !== undefined) {
      customerViewSt.value?.reset({
        params: {
          source: "-1",
          customerName: "",
          key: Number(key),
        },
      });
    }
  }

function cusViewEvent(event: any) {
    if (event.node && event.node.origin) {
      const cusViewnode = event.node.origin;
      getTableList(+cusViewnode.key);
    }
  }

function reqCustomerListCount(nodeKey: string) {
    return new Promise((resolve, reject) => {
      http
        .post(URLS.smartCustomerListCount.url, {
          params: {
            source: "-1",
            customerName: "",
            key: +nodeKey,
          },
          pi: 1,
          ps: 1,
        }).then(
          ({ status, data, errorMsg }) => {
            if (status === 0) {
              resolve(data);
            } else {
              resolve(0);
              dialogService.error("请求失败", errorMsg);
            }
          },
          ({ errorMsg }) => {
            resolve(0);
            dialogService.error("请求失败", errorMsg);
          },
        );
    });
  }

async function rowCheckedChange(event) {
    // 取消勾选
    // if (!event.nodes.length) return;

    // 点击勾选项时，无需执行cusViewEvent(event)查询客户通讯录列表

    // 无需调用URLS.smartCustomerList.url接口
    // 调用URLS.smartCustomerListCount.url接口，将数据封装后，缓存到对应node节点上
    gaddees = [];
    for (let i = 0; i < event.nodes.length; i++) {
      const node = event.nodes[i];
      node.isSelected = false;
      if (node.gadde) {
        gaddees.push(node.gadde);
      } else {
        const len = await reqCustomerListCount(node.key);
        const { title, key, logic } = node.origin;
        const tmp = new Addressee();

        tmp.len = Number(len);
        tmp.name = title;
        tmp.contacts = [];
        tmp.contacts.push("z" + key + "$" + logic + "$" + len);

        node.gadde = tmp;
        gaddees.push(tmp);
      }
    }
  }

function formatTerminal(item, teminalId) {
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

function addAllCusViews() {
    if (!gaddees || gaddees.length < 1) {
      dialogService.warning("提示", "没有勾选中任何数据");
      return;
    }
    let gs = "";
    gaddees.forEach(g => {
      if (g.len > 0) {
        let temp = new Addressee();
        temp.id = new Date().getTime();
        let s = selectAddress.value.find(o => o.id === temp.id);
        if (s) {
          temp.id = new Date().getTime();
          while (s.id === temp.id) {
            temp.id = new Date().getTime();
          }
        }
        temp.name = g.name;
        temp.len = g.len;
        temp.contacts = g.contacts;
        selectAddress.value.push(temp);
        okSelect.value = true;
      } else {
        gs += "【" + g.name + "】";
      }
    });
    if (gs) {
      dialogService.warning("提示", gs + "没有数据");
    }
  }

function onTagClose2(event) {
    let x = selectAddress.value.findIndex(obj => obj.id === event.id);
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
      selectAddress.value.map(item => (item.icon = iconImg3));
      emits('close', selectAddress.value);
    }
  }

function getCustomerView() {
    loading.value = true;
    from(http
      .post(URLS.smartCustomerGroupList.url))
      .pipe(tap(() => (loading.value = false)))
      .subscribe(
        res => {
          nodes.value = res.data.filter(nodeItem => {
            if (nodeItem.count != -1) {
              nodeItem.title = nodeItem.name;
              return true;
            }
          });
          getTableList(nodes.value.length && nodes.value[0] ? nodes.value[0].key : null);
          defaultSelectedKeys.value = nodes.value.length && nodes.value[0] ? [nodes.value[0].key] : ["1"];
        },
        () => {
          loading.value = false;
        },
      );
  }
</script>
<style lang="less" scoped>
.modal-row {
  display: flex;
  height: 420px;

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
      flex: 1;
      margin-top: 0;
      padding: 0 0 5px 0;
      width: 100%;
      height: auto;
      max-height: 355px;
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

    :deep(*) .ant-table-pagination.ant-pagination {
      margin: 16px 8px;
    }

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
.tip {
  font-size: 12px;
  color: #9a9a9a;
  margin: -10px 0 10px;
}
</style>