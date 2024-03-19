/**
 * 在angular中是指令，在vue环境中需要提取为元素
 */
// 指令 -> 元素
export const commonDirectiveEles = [
  "nz-col",
  "nz-row",
  "nz-menu",
  "nz-menu-item",
  "nz-submenu",
  "[nzAutocomplete]",
  "nz-icon",
];
export const wrapperDirectiveEles = ["nz-tooltip", "nz-dropdown", "nz-popover"];
// 一定存在，但是不在位置的节点

// 以下属性是跟指令绑定的
export const directiveElesAttrsMap = {
  common: [
    "*ngIf",
    "*ngFor",
    "acl",
    "acl-ability",
    "hidden",
    "style",
    "class",
    "nzStyle",
    "nzClass",
  ],
  "nz-row": ["nzAlign", "nzGutter", "nzJustify"],
  "nz-col": [
    "nzFlex",
    "nzOffset",
    "nzOrder",
    "nzPull",
    "nzPush",
    "nzSpan",
    "nzXs",
    "nzSm",
    "nzMd",
    "nzLg",
    "nzXl",
    "nzXXl",
  ],
  "nz-tooltip": [
    "nzTooltipTitle",
    "nzTooltipPlacement",
    "nzTooltipOverlayStyle",
    "nzTooltipTrigger",
    "nzTooltipVisible",
    "nzTooltipVisibleChange",
    "nzTooltipOverlayClassName",
  ],
  "nz-popover": [
    "nzPopoverTitle",
    "nzPopoverContent",
    "nzPopoverPlacement",
    "nzPopoverOverlayStyle",
    "nzPopoverTrigger",
    "nzPopoverVisible",
    "nzPopoverVisibleChange",
    "nzPopoverOverlayClassName",
  ],
  "nz-menu": [
    "nzInlineCollapsed",
    "nzMode",
    "nzInlineIndent",
    "nzSelectable",
    "nzTheme",
    "nzClick",
  ],
  "nz-menu-item": ["nzDisabled", "nzSelected"],
  "nz-submenu": [
    "nzPlacement",
    "nzOpen",
    "nzDisabled",
    "nzTitle",
    "nzIcon",
    "nzMenuClassName",
    "nzOpenChange",
  ],
  "nz-dropdown": [
    "nzDropdownMenu",
    "nzDisabled",
    "nzPlacement",
    "nzTrigger",
    "nzClickHide",
    "nzVisible",
    "nzOverlayClassName",
    "nzOverlayStyle",
    "nzVisibleChange",
  ],
};
