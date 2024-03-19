<template>
	<section>
		<div class="modal-header modal-header-update">
			<div class="modal-title">收信人录入</div>
		</div>
		<div class="main clearfix">
			<form :model="validateForm">
				<a-form-item name="phoneNumber"
					:rules="[{ 'required': true, 'message': '请输入手机号码' }, { 'validator': 'forbiddenCurrTextValidator()' }]">
					<span style="font-size: 15px;color: #ccc;">多个手机号码以英文逗号隔开</span>
					<a-textarea ref="inputElement" v-model:value="validateForm.phoneNumber" rows="5"
						style="margin: 5px 0;"></a-textarea>
				</a-form-item>
				<span :style="{
					color: numbersLength > 1000 ? 'red' : '',
					float: 'right'
				}">当前共{{ numbersLength }}/1000个号码</span>
			</form>
		</div>
		<div class="modal-footer modal-footer-update">
			<icc-button :btn-type="'hollow'" @btnClick="close"><span>取消</span></icc-button>
			<icc-button :btn-type="'default'" :is-disabled="!validateForm.valid" @btnClick="(e) => save(validateForm.value)">
				<span>确定</span></icc-button>
		</div>
	</section>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { Addressee } from "src/app/routes/message/Addressee";
import { useNotification } from "@icc/hooks";

const dialogService = useNotification();

defineOptions({
	name: 'IccTextImport',
});

const emits = defineEmits(["close"]);
let iconImg1: string = "./assets/images/send/contact-blue.png";
const validateForm = ref<any>();
const numbersLength = ref<number>(0);
const inputElement = ref<any>();

function ngOnInit() {
	validateForm.value = {
		phoneNumber: '',
	};
}
ngOnInit();

function close() {
	emits('close');
}

function save(form) {
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
	if (!textExp.test(value) || !phoneNumber.some(item => exp.test(item))) {
		dialogService.error('收信人录入', '请按要求格式录入手机号！');
		return;
	}
	let temp = new Addressee();
	temp.name = '收信人';
	temp.icon = iconImg1;
	temp.id = new Date().getTime();
	temp.contacts = phoneNumber.map(num => "," + num);
	temp.len = phoneNumber.length;
	emits('close', temp);
}

function forbiddenCurrTextValidator(): any {
	return (control: any): any | null => {
		const exp = /^[,0-9]*$/
		const val = control.value;
		if (val !== '' && !exp.test(val)) {
			return { validate: true };
		}
		const dotExp = new RegExp('[,]+', 'g');
		let formatString = val.trim().replace(dotExp, ',');
		let numbers = formatString.split(',').filter(str => str !== '');
		numbersLength.value = numbers.length;
		if (numbersLength.value > 1000) {
			return { length: true };
		}
		return null;

	};
}
</script>
<style lang="less" scoped>
.mockTextarea {
	display: inline-block;
	overflow-x: hidden;
	overflow-y: auto;
	flex-direction: column;
	// margin: 20px 0;
	padding: 8px 10px;
	border: 1px solid #d9d9d9;
	border-width: 1px;
	border-style: solid;
	border-color: -internal-light-dark(rgb(118, 118, 118), rgb(133, 133, 133));
	border-radius: 4px;
	border-image: initial;
	width: 100%;
	max-width: 100%;
	height: 150px;
	min-height: 150px;
	appearance: textarea;
	background-color: -internal-light-dark(rgb(255, 255, 255), rgb(59, 59, 59));
	resize: auto;
	cursor: text;
	vertical-align: middle;
	text-overflow: ellipsis;
	text-align: start;
	text-indent: 0;
	text-shadow: none;
	text-transform: none;
	font: 400 13.3333px Arial;
	color: #49536e;
	overflow-wrap: break-word;
	word-break: break-all;
	word-spacing: normal;
	letter-spacing: normal;
	white-space: pre-wrap;
	transition: all .3s, height 0s;

	-webkit-transition: all .3s, height 0s;
	scrollbar-color: rgba(0, 0, 0, .3) #6e6e6e;
	scrollbar-width: thin;
	text-rendering: auto;
	-webkit-rtl-ordering: logical;

	&:hover {
		border-color: #40a9ff !important;
	}

	&:focus {
		outline: none;
		box-shadow: 0 0 5px rgba(222, 240, 255, .8);

		-webkit-box-shadow-color: #1890ff;
	}

	&:focus:before {
		content: none;
	}

	&:empty:before {
		padding-top: 10px;
		line-height: 21px;
		vertical-align: middle;
		font-size: 14px;
		color: #ccc;
		content: attr(placeholder);
	}

	.innerPaster {
		display: inline-block;
		// margin: 0 5px;
		// padding: 0 5px;
		border: 1px solid #b8e5f5;
		width: auto;
		height: 21px;
		background: rgba(184, 229, 245, .14);
	}

	.innerShortLink {
		display: inline-block;
		// margin: 0 5px;
		// padding: 0 5px;
		border: 1px solid #b8e5f5;
		width: auto;
		height: 21px;
		background: rgba(184, 229, 245, .14);
	}
}
</style>