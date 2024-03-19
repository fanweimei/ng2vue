import { StandardBusinessHelperImpl, MsgConfHelperImpl, hasSomePluginBySession, PluginSign } from "@icc/common-lib";
import { MSG_APPTYEP, MSG_APPTYPE_LIST } from "../shared/constant/msgType";

export class StandardBusinessHelper implements StandardBusinessHelperImpl {
  parent: MsgConfHelperImpl;
  get cfg() {
    return this.parent?.cfg;
  }

  canUpdateChannelConfig = true;

  constructor(parent: MsgConfHelperImpl) {
    this.parent = parent;
  }

  initBizApplicationType(msgItem: any, allAppTypeList: any[], businessType: any) {
    const { id, applicationTypeList: oldAppId } = businessType;
    // 是否已有 sms
    let isExist = false;
    // 是否有 M 消息插件
    let hasAimPlugin = hasSomePluginBySession(PluginSign.aim);

    msgItem.applicationTypeList = allAppTypeList.filter(applicationType => {
      if (+applicationType.msgType.value === msgItem.index) {
        applicationType.checked = true;
        applicationType.isDisabled = false;

        if (oldAppId.includes(applicationType.id)) {
          isExist = true;
        }
        if (!hasAimPlugin && applicationType.id === MSG_APPTYEP.aim) {
          return false;
        }
        return true;
      }
    });
    if (id > 0) {
      // 需求要求，编辑已有sms渠道只显示已选应用
      if (isExist) {
        msgItem.applicationTypeList.forEach(type => {
          if (id && !oldAppId.includes(type.id)) {
            type.isDisabled = true;
          }
        });
        msgItem.selectedApplicationType = msgItem.applicationTypeList.find(type => oldAppId.includes(type.id));
      }
      if (!msgItem.selectedApplicationType) {
        msgItem.selectedApplicationType = msgItem.applicationTypeList.find(type => type.id === MSG_APPTYEP.common);
      }
    } else {
      msgItem.selectedApplicationType = msgItem.applicationTypeList.find(type => type.id === MSG_APPTYEP.common);
    }
  }

  clearTemplateByChangeType(changeType: number, businessType: any, appTypeId: number): boolean {
    let result = false;
    switch (changeType) {
      case 1:
        if (appTypeId === MSG_APPTYEP.common || appTypeId === MSG_APPTYEP.aim) {
          businessType.msgTemplates = businessType.msgTemplates.filter(item => Number(item.msgType !== this.cfg?.type));
          result = true;
        }
        break;
      default:
        break;
    }
    return result;
  }

  initMessageByCheckChange(clickMsgItem: any, applicationType: any): void {
    if (clickMsgItem.selected && clickMsgItem.applicationTypeList instanceof Array) {
      let editId: number = -1;
      if (applicationType instanceof Array && applicationType.length > 0) {
        editId = applicationType.find(it => MSG_APPTYPE_LIST.includes(it));
      }
      console.log(editId);
      clickMsgItem.selectedApplicationType = clickMsgItem.applicationTypeList.find(it => it.id === (editId !== -1 ? editId : MSG_APPTYEP.common));
    }
  }
}
