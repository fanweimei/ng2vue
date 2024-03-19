// @ts-nocheck
import { useRouter } from "vue-router";
import { MsgConfig, useMsgService } from "@icc/msg";
import { merge } from "lodash-es";
import { getSearchColumns, getTableColumns } from "./column";
import { computed, ref } from "vue";
import {
  LoadDataParams,
  OnChangeCallbackParams,
  useTable,
  type DynamicTableInstance,
} from "@icc/components/icc-dynamic-table";
import { http } from "@icc/api";
import { URLS } from "@/api/urls";
import { useModal, useNotice, useImpExpTip } from "@icc/hooks";
import BlacklistEdit from "./edit/edit.vue";

type BlacklistEditInstance = InstanceType<typeof BlacklistEdit>;

const { createNotice } = useNotice();
const [Modal] = useModal();
const { createExportTip } = useImpExpTip();

const router = useRouter();
const arr = location.href.split("?")[0].split("/");
const key = arr[arr.length - 1];
if (key == undefined) {
  router.push("/error/404");
}
const msgIns = useMsgService();
const msgJson = msgIns.getMessageConfigByName(key) as MsgConfig;
if (!msgJson) {
  router.push("/error/404");
}
const confHelper = msgIns.getMsgconfHelperInstance(key);
const blackConf = merge(
  {
    list: {
      from: true,
      channel: true,
      remark: true,
    },
    add: {
      mode: 0,
      terminalIdMaxLength: 50,
    },
  },
  confHelper.controlHelper?.blacklistConf
);
const searchColumns = getSearchColumns(msgJson, blackConf);
const st = ref<DynamicTableInstance>();

let searchOptions: any = {};
function onSearch(e) {
  console.log(e);
  searchOptions = {
    start: e.dateRange?.length ? `${e.dateRange[0]} 00:00:00` : null,
    end: (e.dataRange?.length || 0) > 1 ? `${e.dateRange[1]} 23:59:59` : null,
    handleFrom: e.handleFrom,
    strategyType: e.strategyType,
    terminalId: e.terminalId,
    msgType: msgJson.type,
    target: e.target,
  };
  st.value?.reload();
}

// const [IccDynamicTable, dynamicTableInstance] = useTable();

const tableColumns = getTableColumns(msgJson, blackConf);
tableColumns.push({
  title: "操作",
  width: 100,
  dataIndex: "ACTION",
  fixed: "right",
  actions: ({ record }) => [
    {
      label: "删除",
      acl: [`blacklist.${msgJson.en_name}.delete`],
      popConfirm: {
        title: "是否确认删除所选记录？",
        onConfirm: () => deleteItem([record.id]),
      },
    },
  ],
});
function tableRequest(
  params?: LoadDataParams,
  onChangeParams?: OnChangeCallbackParams
) {
  const { pi, ps } = params || {};
  console.log(onChangeParams);
  return http.post(URLS[`${msgJson.en_name}Blacklist`].url, {
    ps,
    pi,
    params: searchOptions,
  });
}

function deleteItem(ids: Array<number | string> = []) {
  if (ids.length === 0) {
    createNotice.error(
      `${msgJson.zh_name}黑名单`,
      `请选择需要删除的${msgJson.zh_name}黑名单`
    );
  } else {
    http.post(URLS[`${msgJson.en_name}BlacklistDel`].url, ids).then((res) => {
      if (res.status === 0) {
        st.value?.reload();
        createNotice.success(`${msgJson.zh_name}黑名单`, "删除成功");
      } else {
        createNotice.error(
          `${msgJson.zh_name}黑名单`,
          res.errorMsg || "所选记录包含不可删除部分。"
        );
      }
    });
  }
}

function add() {
  if (blackConf.add.mode == 1 && searchOptions.channelId === "") {
    createNotice.warning(
      `${msgJson.zh_name}黑名单`,
      `请先选中${msgJson.zh_name}分组!`
    );
    return;
  }
  let params: any = {};
  if (blackConf.add.mode == 1) {
    params = {
      record: {
        channelId: searchOptions.channelId,
        id: 0,
        columns: blackConf.add.column,
      },
      cfgs: msgJson,
    };
  } else {
    params = {
      record: {
        id: 0,
        channelId: searchOptions.channelId,
        terminalMaxLength: blackConf.add.terminalIdMaxLength,
      },
      cfgs: msgJson,
    };
  }
  const editIns = ref<BlacklistEditInstance>();
  Modal.show({
    title: "新增黑名单",
    width: 1000,
    content: () => {
      return (
        <BlacklistEdit
          ref={editIns}
          record={params.record}
          cfgs={params.cfgs}
        />
      );
    },
    onOk: async () => {
      return editIns.value?.save().then(() => {
        st.value?.reload();
      });
    },
    onCancel: () => {
      editIns.value?.reset();
    },
  });
}

function importFile() {}

function exportFile() {
  createExportTip();
}

function batchDelete() {}
