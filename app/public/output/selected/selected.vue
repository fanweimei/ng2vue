<template>
<div class="icc-selected" v-if="show">
  <a class="flex-center info">
    <img v-if="iconImg" :src="iconImg" alt="" />
    <icc-table-text v-if="text" :text="text" style="max-width: 100px; text-align: start"></icc-table-text>
    <span v-if="count > 0">
      (
      <span class="count-text">{{ count }}</span>
      )
    </span>
  </a>
  <span class="flex-center operate">
    <img class="img-delete" :src="deleteImg" alt="" @click="handleDelClick" @mouseover="handleDelOver" @mouseleave="handleDelLeave" />
  </span>
</div>

</template>
<script lang="ts" setup>
import { PropType, ref } from "vue";

defineOptions({
	name: 'AppSelected',
});

const props = defineProps({
	iconImg: {
	type: String,
	},
	text: {
	type: String,
	},
	count: {
	type: Object as PropType<any>,
	},
});
const emits = defineEmits(["delete"]);
let delImgs = {
    default: "./assets/images/send/i_delete_gray.png",
    hover: "./assets/images/send/i_delete_red.png",
  };
const show = ref(true);
const deleteImg = ref<string>(delImgs.default);

function handleDelClick() {
    show.value = false;
    emits('delete', props.text);
  }

function handleDelOver() {
    deleteImg.value = delImgs.hover;
  }

function handleDelLeave() {
    deleteImg.value = delImgs.default;
  }
</script>
<style lang="less" scoped>
.icc-selected {
	display: flex;
	justify-content: space-between;
	margin: 8px 0;
	padding: 5px 10px;
	min-width: 180px;
	cursor: pointer;
	.flex-center {
		display: flex;
		align-items: center;
	}
	.info {
		cursor: default;
		color: #49536e;
		img {
			margin-right: 8px;
		}
		.count-text {
			color: #4880ff;
		}
	}
	.operate > img {
		cursor: pointer;
	}
	&:hover {
		background: #f3f4f9;
	}
}
</style>