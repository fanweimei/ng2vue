import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-selected",
  templateUrl: "./selected.component.html",
  styleUrls: ["./selected.component.less"],
})
export class SelectedComponent {
  show = true;
  @Input() iconImg: string;
  @Input() text: string;
  @Input() count: any;
  @Output() delete: EventEmitter<string> = new EventEmitter<string>();
  delImgs = {
    default: "./assets/images/send/i_delete_gray.png",
    hover: "./assets/images/send/i_delete_red.png",
  };
  deleteImg: string = this.delImgs.default;

  constructor() {}

  handleDelClick() {
    this.show = false;
    this.delete.emit(this.text);
  }
  handleDelOver() {
    this.deleteImg = this.delImgs.hover;
  }
  handleDelLeave() {
    this.deleteImg = this.delImgs.default;
  }
}
