<template>
  <section>
    <div class="modal-header-update">
      <div class="modal-title">通讯中心</div>
    </div>

    <div class="modal-row">
      <a-tabset @change="customerTabChange" :tab-bar-gutter="0" class="modal-column-1" :active-key="curTab">
        <a-tab-pane tab="客户通讯录">
          <a-spin tip="加载中..." :spinning="loading" style="overflow: auto; height: 455px">
            <div class="tree-box">
              <a-tree ref="phonelist" :tree-data="nodes" :expanded-keys="defaultExpandedKeys"
                :selected-keys="defaultSelectedKeys" @select="nzEvent" show-line="true"></a-tree>
            </div>
          </a-spin>
        </a-tab-pane>
        <a-tab-pane tab="员工通讯录">
          <a-spin tip="加载中..." :spinning="loading" style="overflow: auto; height: 455px">
            <div class="tree-box">
              <a-tree ref="employeeTree" :tree-data="employeeNodes" :expanded-keys="defaultExpandedKeys"
                :selected-keys="defaultSelectedKeys" @select="employeeEvent" show-line="true"></a-tree>
            </div>
          </a-spin>
        </a-tab-pane>
      </a-tabset>

      <div class="modal-column-2">
        <div class="form-box">
          <div class="flex-col-center">
            <sf ref="sf" :ui="ui" mode="search" :button="null" :schema="searchSchema"
              style="text-align: right; padding: 10px 10px 0"></sf>
            <span class="question-box">
              <a-tooltip>
                <question-circle-two-tone />
                <template #title>
                  <div style="font-size: 12px">
                    <b>不去重</b>
                    ：如果一个用户属于多个分组，列表中会展示多条该用户数据，分别属于不同分组。
                    <br />
                    <b>去重</b>
                    ：如果一个用户属于多个分组，列表中只展示一条该用户数据，分组合并展示。
                    <br />
                    (当客户通讯录数据达到200万时，勾选去重查询会影响页面加载和查询速度。)
                  </div>
                </template>
              </a-tooltip>
            </span>
          </div>
          <icc-button class="btn-search" :btn-type="'default'" @btnClick="searchCustomerList">
            <span>查询</span>
          </icc-button>
          <icc-button class="btn-cancel" :btn-type="'hollow'" @btnClick="resetCustomerList">
            <span>重置</span>
          </icc-button>
        </div>
        <div class="my-md" style="margin-top: 26px !important">
          <a-alert :type="'info'" :show-icon="true">
            <template #message>
              已选择
              <strong class="text-primary">{{ selectedRows.length }}</strong>
              项
            </template>
          </a-alert>
        </div>
        <div style="padding: 0 10px">
          <icc-dynamic-table ref="st" :scroll="{ x: '730px' }" :data="customerUrl" :columns="columns" :res="res"
            :req="req" @change="stChange" style="max-height: 400px; overflow: auto">
            <template #templ-group="item">
              <icc-multi-line-cell :list="item.groups" :lines="2"></icc-multi-line-cell>
            </template>
            <template #templ-name="item">
              <icc-table-text :text="item.name" :width="100"></icc-table-text>
            </template>
            <template #templ-regId="item">
              <icc-table-text :text="item.regId" :width="100"></icc-table-text>
            </template>
            <template #templ-alias="item">
              <icc-table-text :text="formatAlias(item, terminalType.apppush)" :width="100"></icc-table-text>
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
            <template #tmpl-email="item">
              <icc-table-text :text="formatEmail(item, terminalType.email)" :width="100"></icc-table-text>
            </template>
          </icc-dynamic-table>
        </div>
      </div>
      <div class="modal-column-3">
        <a-button @click="addAllContacts" :loading="isRequestCount" class="add-all-btn-cls">添加全部</a-button>
        <icc-button :btn-type="'default'" @btnClick="addSelectedContacts">
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
    </div>
  </section>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { Customer } from "src/app/routes/message/Customer";
import { Addressee } from "src/app/routes/message/Addressee";
import { switchMap } from "rxjs/operators";
import { Subject } from "rxjs/internal/Subject";
import { of, zip } from "rxjs";
import { isJsonString, TERMINALTYPE } from "@icc/utils";
import { URLS } from "@/api/interface";
import { DynamicTableInstance, Req, Res, TableColumn } from "@icc/components/icc-dynamic-table";
import { http } from "@icc/api";
import { useAclService, useMsgPluginFilterService, useNotification } from "@icc/hooks";
import { useMsgconfHelperService, useMsgService } from "@icc/msg";

const messageService = useMsgService();
const dialogService = useNotification();
const msgPluginFilterService = useMsgPluginFilterService();
const confhelperService = useMsgconfHelperService();
const aclService = useAclService();

defineOptions({
  name: 'AppCommcenter',
});

const emits = defineEmits(["close"]);
let lastItemIds: any = {};
let curPage: number = 0;
let _name: string = "";
let _phone: string = "";
let _distinctRows: boolean = false;
let _groupId: string;
let _path: string;
let _groupName: string;
let contactsTotal$ = new Subject<any>();
let showPhoneSeach: boolean;
let records: Addressee[] = [];
let selectCount: number = 0;
let addee: Addressee = new Addressee();
let customers: Customer[] = [];
let _groupLen: number;
let iconImg1: string = "./assets/images/send/contact-blue.png";
let showCustomer: boolean = false;
let showEmployee: boolean = false;
let msgTypes: any;
const curTab = ref<number>(0);
const loading = ref<boolean>(false);
const nodes = ref<any[]>([]);
const defaultExpandedKeys = ref(["1"]);
const defaultSelectedKeys = ref(["1"]);
const employeeNodes = ref<any[]>([]);
const searchSchema = ref<any>();
const selectedRows = ref<any[]>([]);
const customerUrl = ref(URLS.customerList.url);
const columns = ref<TableColumn[]>([
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
]);
const isRequestCount = ref<boolean>();
const selectAddress = ref<Addressee[]>([]);
const okSelect = ref<boolean>(false);
const st = ref<DynamicTableInstance>();
const sf = ref<any>();
const viewpPoneListTree = ref();
const viewEmployeeListTree = ref();
const ui = reactive<any>({
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
});
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

function ngOnInit() {
  showCustomer = aclService.canAbility("contacts.customer.list");
  showEmployee = aclService.canAbility("contacts.employee.list");
  contactsTotal$
    .pipe(
      switchMap(params => {
        let url = curTab.value == 0 ? URLS.customerTotal.url : URLS.employeeTotal.url;
        return http.post(url, {
          pi: st.value?.pi.value,
          ps: st.value?.ps.value,
          params,
        });
      }),
    )
    .subscribe(
      res => {
        _groupLen = res.data || 0;
        isRequestCount.value = false;

      },
      err => {
        isRequestCount.value = false;

      },
    );

  loading.value = true;
  let getCustomerList = showCustomer ? http.get(URLS.customerGroupList.url) : of({ status: -1 });
  let getEmployeeList = showEmployee ? http.get(URLS.employeeGroupList.url) : of({ status: -1 });
  zip(getCustomerList, getEmployeeList).subscribe(
    ([customRes, employeeRes]) => {
      if (customRes.status === 0 && customRes.data) nodes.value = customRes.data;
      if (employeeRes.status === 0 && employeeRes.data) employeeNodes.value = employeeRes.data;
      customerTabChange(curTab.value);
      loading.value = false;
    },
    () => {
      loading.value = false;
    },
  );

  msgPluginFilterService.msgTypeFilter(msgTypes => {
    msgTypes = msgTypes;
    // 刷新通讯中心和客群的列表
    let msgAddColumns: any[] = [];
    msgTypes.forEach(item => {
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
    columns.value = columns.value.concat(msgAddColumns);
    // 智能客群添加动态列
    st.value ? && st.value?.resetColumns({ columns: columns.value, emitReload: true });
  });

  searchSchema.value = {
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
  showPhoneSeach = !!messageService.getData().find(item => ["sms", "voice", "rcs5g", "videoSms"].includes(item.en_name));
  if (showPhoneSeach) {
    searchSchema.value.properties!.phone = {
      type: "string",
      title: "手机号码",
    };
  }
  searchSchema.value.properties!.distinctRows = {
    type: "string",
    title: "去重",
  };
}
ngOnInit();

onMounted(() => {
  const nodes = viewpPoneListTree.value?.cdr._view ? viewpPoneListTree.value?.cdr._view.nodes : [];
  if (nodes && nodes[0] && nodes[0].renderElement) {
    nodes[0].renderElement.style.padding = "18px";
    nodes[0].renderElement.style.width = "fit-content";
  }
  const paginations = st.value?.el.value.getElementsByClassName("ant-table-pagination");
  if (paginations && paginations[0]) {
    paginations[0].style.paddingRight = "20px";
  }
})

function requestContactsTotal(params) {
  isRequestCount.value = true;
  contactsTotal$.next(params);
}

function customerTabChange(index: any) {
  let items = index === 0 ? nodes.value[0] : employeeNodes.value[0];
  let path = items?.path || "";
  let key = items?.key || "";
  _name = "";
  _phone = "";
  _distinctRows = false;
  _groupId = key;
  _path = path;
  _groupName = "收信人";
  customerUrl.value = index === 0 ? URLS.customerList.url : URLS.employeeList.url;
  curTab.value = index;
  lastItemIds = {};
  sf.value?.reset();
  // 列表请求
  st.value?.reset({
    params: {
      state: "0",
      path: _path,
      groupId: _groupId,
      source: "-1",
    },
  });
  // 总数请求
  requestContactsTotal({
    state: "0",
    path: _path,
    groupId: _groupId,
    source: "-1",
  });
  // 延迟选中节点项
  setTimeout(() => {
    defaultSelectedKeys.value = [_groupId];
  }, 100);
}

function clean() {
  records = [];
  selectCount = 0;
}

function nzEvent(event: any) {
  const tmps: any[] = viewpPoneListTree.value?.getSelectedNodeList();
  if (!tmps || tmps.length === 0) {
    // 没选中任何节点，当前节点则继续显示选中
    defaultSelectedKeys.value = [];
    defaultSelectedKeys.value.push(event.node?.key as string);
    return;
  }
  sf.value?.reset();
  if (event.node) {
    _groupId = event.node.origin.key;
    _path = event.node.origin.path;
    _groupName = event.node.origin.title;
    _name = sf.value?.value.name == undefined ? "" : sf.value?.value.name;
    _phone = sf.value?.value.phone == undefined ? "" : showPhoneSeach ? sf.value?.value.phone : "";
    // 在这里替换掉根节点的名称
    if (event.node.parentNode === null) {
      _groupName = "收信人";
    }
    lastItemIds = {};
    st.value?.reset({
      params: {
        state: "0",
        path: _path,
        groupId: _groupId,
        source: "-1",
        name: "",
        phone: "",
      },
    });
    requestContactsTotal({
      state: "0",
      path: _path,
      groupId: _groupId,
      source: "-1",
      name: "",
      phone: "",
    });
    clean();
  }
}

function employeeEvent(event: any) {
  const tmps: any[] = viewEmployeeListTree.value?.getSelectedNodeList();
  if (!tmps || tmps.length === 0) {
    // 没选中任何节点，当前节点则继续显示选中
    defaultSelectedKeys.value = [];
    defaultSelectedKeys.value.push(event.node?.key as string);
    return;
  }
  sf.value?.reset();
  if (event.node) {
    _groupId = event.node.origin.key;
    _path = event.node.origin.path;
    _groupName = event.node.origin.title;
    // 在这里替换掉根节点的名称
    if (event.node.parentNode === null) {
      _groupName = "收信人";
    }
    lastItemIds = {};
    st.value?.reset({
      params: {
        state: "0",
        path: _path,
        groupId: _groupId,
      },
    });
    requestContactsTotal({
      state: "0",
      path: _path,
      groupId: _groupId,
    });
    clean();
  }
}

function search(params) {
  params.groupId = _groupId;
  params.path = _path;
  params.state = "0";
  params.source = "-1";
  _name = params.name == undefined ? "" : params.name;
  _distinctRows = params.distinctRows ? true : false;
  _phone = params.phone == undefined ? "" : showPhoneSeach ? params.phone : "";
  lastItemIds = {};
  st.value?.reset({ params });
  requestContactsTotal(params);
}

function searchCustomerList() {
  search(sf.value?.value);
}

function resetCustomerList() {
  lastItemIds = {};
  sf.value?.reset();
  st.value?.reset({
    params: {
      groupId: _groupId,
      path: _path,
      phone: "",
      state: "-1",
      source: "-1",
      name: "",
      distinctRows: false,
    },
  });
  requestContactsTotal({
    groupId: _groupId,
    path: _path,
    phone: "",
    state: "-1",
    source: "-1",
    name: "",
    distinctRows: false,
  });
}

function stChange(e: any) {
  switch (e.type) {
    case "checkbox":
      selectedRows.value = e.checkbox!;
      addee = null!;
      let temp = new Addressee();
      let len = selectedRows.value.length;
      selectCount = len;
      if (len > 0) {
        customers = [];
        addee = new Addressee();
        addee.contacts = [];
        addee.len = len;
        if (_groupName) {
          addee.name = _groupName;
        }
      }
      for (let row of selectedRows.value) {
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
        addee.contacts.push(contact);
        customers.push(customer);
      }
      temp.len = len;
      temp.name = _groupName;
      let c = true;
      records = records.filter((item, i) => {
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
      selectedRows.value = [];
      break;
  }
}

function formatAlias(item, teminalId) {
  let result = "";
  if (item.contactsTerminalDto && item.contactsTerminalDto.length) {
    const array = item.contactsTerminalDto.filter(t => t.alias && t.terminalType == teminalId);
    if (array && array.length) {
      result = array[0].alias;
    }
  }
  return result;
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

function formatEmail(item, teminalId) {
  let result = "";
  if (item.contactsTerminalDto && item.contactsTerminalDto.length) {
    const findItem = item.contactsTerminalDto.find(t => t.terminal && t.terminalType == teminalId);
    if (findItem) result = findItem ? findItem.terminal : "";
  }
  return result;
}

function addAllContacts() {
  if (!_groupLen || _groupLen < 1) {
    dialogService.warning("提示", "该分组没有数据");
    return;
  }
  let temp = new Addressee();
  temp.contacts = [];
  temp.id = new Date().getTime();
  temp.name = _groupName;
  temp.len = _groupLen;
  let c = "";
  if (curTab.value === 1) {
    c = "y" + _groupId + "$" + _path + "$" + _groupLen + "$" + _name + "$" + _phone + "$" + _distinctRows;
  }
  if (curTab.value === 0) {
    c = "g" + _groupId + "$" + _path + "$" + _groupLen + "$" + _name + "$" + _phone + "$" + _distinctRows;
  }
  temp.contacts.push(c);
  selectAddress.value.push(temp);
  okSelect.value = true;
}

function addSelectedContacts() {
  if (!addee || addee.len < 1) {
    dialogService.warning("提示", "没有勾选中任何数据");
    return;
  }
  if (addee && addee.len > 0) {
    let temp = new Addressee();
    temp.id = new Date().getTime();
    temp.name = addee.name;
    temp.len = addee.len;
    temp.contacts = addee.contacts;
    selectAddress.value.push(temp);
    okSelect.value = true;
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
  // console.log(selectAddress.value);
  if (selectAddress.value instanceof Array && selectAddress.value.length > 0) {
    selectAddress.value.map(item => (item.icon = iconImg1));
    emits('close', selectAddress.value);
  }
}
</script>
<style lang="less" scoped>
* {
  :deep(*) {
    .ant-tooltip .ant-tooltip-content .ant-tooltip-inner {
      width: 300px;
      max-width: 300px !important;
    }
  }
}

.modal-row {
  display: flex;
  height: 520px;

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
      max-height: 455px;
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

    .form-box {
      position: relative;
      margin-bottom: -28px;
      padding-right: 150px;

      .flex-col-center {
        display: flex;
        align-items: center;

        .question-box {
          margin-left: -30px;
          margin-top: 4px;
        }
      }

      .distinct-tip {
        position: absolute;
        right: 210px;
        top: 15px;
      }

      .btn-search {
        position: absolute;
        right: 90px;
        top: 10px;
      }

      .btn-cancel {
        position: absolute;
        right: 5px;
        top: 10px;
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
</style>