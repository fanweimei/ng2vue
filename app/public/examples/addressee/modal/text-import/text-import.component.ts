import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { format } from '@delon/util';
import { DialogService } from '@icc/common-lib';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Addressee } from 'src/app/routes/message/Addressee';

@Component({
  selector: 'icc-text-import',
  templateUrl: './text-import.component.html',
  styleUrls: ['./text-import.component.less'],
})
export class TextImportModalComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef, private modal: NzModalRef, private fb: UntypedFormBuilder, private dialogService: DialogService) {}

  validateForm: UntypedFormGroup;

  // 号码个数
  numbersLength: number = 0;

  iconImg1 = "./assets/images/send/contact-blue.png";

  @ViewChild('inputElement', { static: false }) inputElement: ElementRef;

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      phoneNumber: ['', [Validators.required, this.forbiddenCurrTextValidator()]],
    });
  }

  forbiddenCurrTextValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const exp = /^[,0-9]*$/
      const val = control.value;
      if (val !== '' && !exp.test(val)) {
        return { validate : true };
      }
      const dotExp = new RegExp('[,]+', 'g');
      let formatString = val.trim().replace(dotExp, ',');
      let numbers = formatString.split(',').filter(str => str !== '');
      this.numbersLength = numbers.length;
      if (this.numbersLength > 1000) {
        return { length : true };
      }
      return null;
      
    };
  }

  save(form) {
    let value: string = form.phoneNumber;
    let phoneNumber = value.split(',').filter(str => str !== '');
    if (phoneNumber.length > 0) {
      phoneNumber = phoneNumber.map(str => str.trim());
    }
    // 号码验证
    const exp = /^[1][0-9]{10}$/;
    // 整体文本验证，逗号之间不能为空
    const textExp = /^([1][0-9]{10},?)+$/;
    // 不符合手机号码的格式，弹出提示
    if ( !textExp.test(value) || !phoneNumber.some(item => exp.test(item))) {
      this.dialogService.notification.error('收信人录入', '请按要求格式录入手机号！');
      return;
    }
    let temp = new Addressee();
    temp.name = '收信人';
    temp.icon = this.iconImg1;
    temp.id = new Date().getTime();
    temp.contacts = phoneNumber.map(num => "," + num);
    temp.len = phoneNumber.length;
    this.modal.close(temp);
  }

  close() {
    this.modal.destroy();
  }
}
