import { _HttpClient } from "@delon/theme";
import { StandardMessageHelperImpl, MsgConfHelperImpl, ADDRESS_BUTTON, AddressButtonCollection, TERMINALTYPE } from "@icc/common-lib";
import { Observable } from "rxjs";

export class StandardMessageHelper implements StandardMessageHelperImpl {
  parent: MsgConfHelperImpl;
  get cfg() {
    return this.parent?.cfg;
  }

  constructor(parent: MsgConfHelperImpl) {
    this.parent = parent;
  }

  mobilePreview: boolean = true;

  // 是否不需要收信人
  isNoNeedAddress: boolean = false;

  modalType: string = "text-import";

  getAddresseeOperateButtons(ignoreAudit?: boolean, isGroupWay?: boolean): AddressButtonCollection {
    return {
      ...ADDRESS_BUTTON,
      exist: [
        {
          zh_name: "编辑录入",
          modalType: this.modalType,
          icon: "text-import.png",
        },
      ],
    };
  }
  requrestChannelInfo(http?: _HttpClient, bizTypeId?: number): boolean | Observable<any> {
    return false;
  }

  getPreSendButton(condition?: any): { modalType: string; promptText: string; desc: string } | null {
    return null;
  }
  existTemplate(applicationTypeList: number[]): { exist: boolean; tip: string } {
    return {
      exist: true,
      tip: "",
    };
  }

  getTerminalColumnConf(): { title: string; width: number; index?: string; format?: Function }[] {
    return [
      {
        title: `${this.cfg?.terminalId.idName}`,
        width: 130,
        format: (item: any): string => {
          let result = "";
          if (item.contactsTerminalDto && item.contactsTerminalDto.length) {
            const findItem = item.contactsTerminalDto.find(t => t.terminal && t.terminalType == TERMINALTYPE.phone);
            if (findItem) result = findItem ? findItem.terminal : "";
          }
          return result;
        },
      },
    ];
  }
}
