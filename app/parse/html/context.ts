import { HtmlParser } from ".";
import { HEleNode, HNode } from "./typings";

// 当前正在遍历的元素以及父元素
interface HtmlContext {
  curformStack: HEleNode[];
  curNode: HEleNode;
  curParent: HEleNode | null;
  json: HNode[];
  setCurNode: (node: HEleNode) => void;
  htmlParser: HtmlParser;
  init: (json: HNode[], htmlParser: HtmlParser) => void;
}
export const htmlContext: HtmlContext = {
  curformStack: [], // 最新的form节点栈
  curNode: null,
  curParent: null,
  json: [],
  htmlParser: null,
  setCurNode(node: HEleNode) {
    this.curParent = this.curNode;
    this.curNode = node;
  },
  init(json: HNode[], htmlParser: HtmlParser) {
    this.curformStack = [];
    this.curNode = null;
    this.curParent = null;
    this.json = json;
    this.htmlParser = htmlParser;
  },
};
