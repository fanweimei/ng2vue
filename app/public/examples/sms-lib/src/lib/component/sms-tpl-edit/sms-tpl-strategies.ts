import { deepCopy } from "@delon/util";
import { invalidSendContent, isArray } from "@icc/common-lib";

export const SMS_TPL_STRATEGIES = {
  /**
   * @description: 短信模板通用校验规则
   */
  public: {
    // 是否有一个可用的模板
    isAvailableTpl(templates: any[], errorMsg: string): string {
      return templates!.filter(item => item.state !== 0).length >= 1 ? "" : errorMsg;
    },

    // 属性是否为空
    isEmpty(attr: any, errorMsg: string): string {
      let arr = isArray(attr) ? deepCopy(attr) : [attr];
      return arr.some(item => !item) ? errorMsg : "";
    },

    // 属性是否为空，增加trim校验
    isEmptyWithTrim(attr: any, errorMsg: string): string {
      return !attr || !attr.trim() ? errorMsg : "";
    },

    // 模板内容合法性校验
    isInvalidContent(content: string, errorMsg: string): string {
      return invalidSendContent(content) ? errorMsg : "";
    },

    // 消息模板是否有执行条件
    anyCondition(conditions: any[], errorMsg: string): string {
      return conditions && conditions?.length === 0 ? errorMsg : "";
    },

    // 消息模板的执行条件是否已经保存
    isEditCondition(conditions: any[], errorMsg: string): string {
      return conditions.some(it => it.isEdit) ? errorMsg : "";
    },
  },

  /**
   * @description: 普通消息校验规则
   */
  common: {
    // 普通短信模板名称校验
    validName(valid: boolean, name: string, errorMsg: string): string {
      return !valid || !name || !name.trim() ? errorMsg : "";
    },
  },

  /**
   * @description: M消息校验规则
   */
  aim: {
    // M消息模板是否停用
    isStop(status: number, errorMsg: string): string {
      return status === 0 ? errorMsg : "";
    },
  },
};
