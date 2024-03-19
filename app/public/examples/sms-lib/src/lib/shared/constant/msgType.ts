export const MSG_TYPE = 0;
export const MSG_KEY = "sms";
export const MSG_APPTYPE_LIST = [1, 2, 3, 4];
export enum MSG_APPTYEP {
  common = 1, // 普通消息
  autoReply = 2, // 自动回复
  reply = 3, // 短信回复
  aim = 4, // M 消息
}
/**
 * 运营商
 */
export const Operator = {
  1: "移动",
  2: "联通",
  3: "电信CDMA",
};

/**
 * 内容类型
 */
export const MSG_CONTENT_TYPE = {
  IMAGE_TEXT: 1, // 图文 | 邮件
  TEXT: 2, // 文字
  IMAGE: 3, // 图片
  VIDEO: 4, // 视频
  AUDIO: 5, // 语音通知
};

/* 贴片类型 */
export const PATCHTYPES = [
  { label: "文本", value: "1", checked: false },
  { label: "语音通知文本", value: "2", checked: false },
  { label: "图片", value: "3", checked: false },
];

/**
 * 通过组件类型获取对应组件的配置对象
 * @param tplOptions  模板配置
 * @param compType  组件类型
 * @returns 对应组件的配置对象
 */
export function getCompOptionsByType(tplOptions: any, compType: string) {
  let result: any[] = [];
  if (tplOptions instanceof Array) {
    tplOptions.forEach(tabOptions => {
      if (tabOptions.guide && tabOptions.guide.type === compType) {
        result.push(tabOptions.guide);
      }
      if (!tabOptions.form) return;
      const formComps = tabOptions.form;
      if (formComps instanceof Array) {
        formComps.forEach(compItem => {
          if (compItem.type === compType) {
            result.push(compItem);
          } else if ("nz-tabset" === compItem.type && compItem.tabList instanceof Array) {
            compItem.tabList.forEach(innerTab => {
              if (innerTab.form instanceof Array) {
                innerTab.form.forEach(innerComp => {
                  if (innerComp.type === compType) {
                    result.push(innerComp);
                  }
                });
              }
            });
          }
        });
      }
    });
  }
  return result;
}
