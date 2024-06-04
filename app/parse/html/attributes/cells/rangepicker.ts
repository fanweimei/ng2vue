import { HAttr, HEleNode } from "@ngParse/html/typings";
import { isRemoveAttr } from "../const";
import { commonAttrs } from "./default";

/**
 * 日期控件
 * 需要特殊处理ngModel/ngModelEnd/nzFormat
 */
export function rangepicker(item: HEleNode) {
    let newAttrs: Array<HAttr> = [];
    let start: string = '', end: string = '';
    for (let attr of item.attributes) {
        switch (attr.key) {
            case '[(ngModel)]':
            case '[ngModel]':
                start = attr.value?.trim();
                break;
            case '[(ngModelEnd)]':
            case '[ngModelEnd]':
                end = attr.value?.trim();
                break;
            case 'nzFormat':
            case '[nzFormat]':
                attr.value = attr.value.replace('yyyy', 'YYYY').replace('-mm', '-MM').replace('dd', 'DD').replace('hh', 'HH').replace(':MM', ':mm').replace('SS', 'ss');
            default:
                if (!isRemoveAttr(item, attr)) {
                    commonAttrs(attr, newAttrs);
                }
                break;
        }
    }
    // 去掉最后的[0]
    if(start && start.endsWith('[0]')) {
        start = start.slice(0, start.length-3);
    }
    if(end && end.endsWith('[1]')) {
        end = end.slice(0, end.length - 3);
    }
    let value = '';
    if(start&&end) {
        if(start == end) {
            value = start;
        } else {
            value = `[${start}, ${end}]`;
        }
    } else {
        value = start;
    }
    if(value) {
        newAttrs.push({
            key: 'v-model:value',
            value
        });
    }
    item.attributes = newAttrs;
}
