/**
 * 关键词替换
 */

import { htmlContext } from "../context";
import { HAttr, HEleNode } from "../typings";

/**
 * 事件名称替换
 * 不符合(fn)="xxx"  --> @fn="xxx" 这种格式的
 */
export const emitsMap = {
  ["*"]: {
    nzOnSearch: "search",
    nzPageIndexChange: "change",
    nzOnOpenChange: "openChange",
  },
  "nz-tabset": {
    nzSelectedIndexChange: "change",
  },
  "nz-tree": {
    nzClick: "select",
    nzCheckBoxChange: "check",
  },
  form: {
    ngSubmit: "finish",
  },
  "nz-table": {
    nzPageIndexChange: "change",
    nzPageSizeChange: "change",
  },
};

/**
 * 属性名prop替换
 * 不符合 [nzXxxYyy] -> :xxx-yyy 这种格式的
 */
export const propsMap = {
  ["*"]: {
    optionalHelp: "help",
    nzPlaceHolder: "placeholder",
    nzFor: "htmlFor",
    nzPageIndex: "current",
    nzAutoFocus: "autofocus",
    ngClass: "class",
    ngStyle: "style",
    hidden: "v-show",
  },
  "nz-tabset": {
    nzSelectedIndex: "v-model:activeKey",
  },
  "nz-tab": {
    nzTitle: "tab",
  },
  "nz-tree": {
    nzData: "treeData",
    nzTreeTemplate: "title",
    nzSelectedKeys: "v-model:selected-key",
    nzExpandedKeys: "v-model:expanded-keys",
    nzCheckedKeys: "v-model:checked-keys",
  },
  input: {
    nzAddOnAfter: "addonAfter",
    nzAddOnBefore: "addonBefore",
  },
  "a-input": {
    nzAddOnAfter: "addonAfter",
    nzAddOnBefore: "addonBefore",
  },
  "nz-modal": {
    nzVisible: "v-model:visible",
  },
};

/**
 * 标签名替换
 * 不符合 nz-xxx -> a-xxx 格式的
 */
export const tagsMap = {
  "nz-option": "a-select-option",
  "ng-container": "template",
  se: "a-form-item",
  "nz-header": "a-layout-header",
  "nz-sider": "a-layout-sider",
  "nz-content": "a-layout-content",
  "nz-submenu": "a-sub-menu",
  "nz-checkbox-wrapper": "a-checkbox-group",
  "nz-tab": "a-tab-pane",
  "nz-tabset": "a-tabs",
  "ng-content": "slot",
  "icc-multi-line-cell": "icc-table-mtext",
  input: "a-input",
  textarea: "a-textarea",
};

export function getPropsKey(key: string) {
  let tagName = htmlContext.curNode.tagName;
  let map = {
    ...(propsMap["*"] || {}),
    ...(propsMap[tagName] || {}),
  };
  return map[key] || key;
}

export function getEmitsKey(key: string) {
  let tagName = htmlContext.curNode.tagName;
  let map = {
    ...(emitsMap["*"] || {}),
    ...(emitsMap[tagName] || {}),
  };
  return map[key] || key;
}

export function getTagKey(key: string) {
  return tagsMap[key] || key;
}

/**
 * 需要过滤的标签
 * nz-dropdown-menu 已经在nz-dropdown中处理过了
 */
export const needFilterTags = ["nz-dropdown-menu"];

// 某些组件需要过滤的属性
export const needFilterAttrs = {
  "icc-upload": ["filter"],
  "nz-upload": ["nzSize", "nzFileType", "nzFilter"],
  "nz-tree": ["nzAsyncData"],
  "nz-range-picker": ["ngModelEnd"],
  "*": ["*nzModalContent"],
};

export function isRemoveAttr(node: HEleNode, attr: HAttr) {
  if (
    needFilterAttrs[node.tagName] &&
    needFilterAttrs[node.tagName].find((s) => attr.key.includes(s))
  ) {
    return true;
  }
  if (
    needFilterAttrs["*"] &&
    needFilterAttrs["*"].find((s) => attr.key.includes(s))
  ) {
    return true;
  }
  return false;
}

// 属性是对应ng-template模板的
export const templAttrMap = {
  // 'nz-alert': ['nz']
};
