<template>
	<view class="list">
		<view class="fixbg" :style="{ backgroundImage : 'url('+ playlist.coverImgUrl +')' }"></view>
		<musichead title="歌单" :icon="true" color="white"></musichead>
		<view class="container" v-show="!isLoading">
			<scroll-view scroll-y="true">
				<view class="list-head">
					<view class="list-head-img">
						<image :src="playlist.coverImgUrl" mode=""></image>
						<text class="iconfont icon-yousanjiao">{{ playlist.playCount | formatCount }}</text>
					</view>
					<view class="list-head-text">
						<view>{{ playlist.name }}</view>
						<view>
							<image :src="playlist.creator.avatarUrl" mode=""></image>
							{{ playlist.creator.nickname }}
						</view>
						<view>
							{{ playlist.description }}
						</view>
					</view>
				</view>
				
				<!-- #ifdef MP-WEIXIN -->
				<button class="list-share" open-type="share">
					<text class="iconfont icon-fenxiang"></text>分享给微信好友
				</button>
				<!-- #endif -->
				
				<view class="list-music">
					<view class="list-music-head">
						<text class="iconfont icon-bofang"></text>
						<text>播放全部</text>
						<text>(共{{ playlist.trackCount }}首)</text>
					</view>
					
					<view class="list-music-item" v-for="(item, index) in playlist.tracks" :key="index" @tap="handleToDetail(item.id)">
						<view class="list-music-top">{{ index + 1 }}</view>
						<view class="list-music-song">
							<view>{{ item.name }}</view>
							<view>
								<image v-if="privileges[index].flag > 60 && privileges[index].flag < 70 " src="~@/static/dujia.png" mode=""></image>
								<image v-if="privileges[index].maxbr == 999000" src="~@/static/sq.png" mode=""></image>
								{{ item.ar[0].name }} - {{ item.name }}
							</view>
						</view>
						<text class="iconfont icon-bofangqi-bofangshu"></text>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import '@/common/iconfont.css'
	import musichead from '@/components/musichead/musichead.vue'
	import { list } from '@/common/api.js'
	export default {
		data() {
			return {
				playlist: {
					coverImgUrl: '',
					trackCount: '',
					creator: {
						avatarUrl: ''
					}
				},
				privileges: [],
				isLoading: true
			}
		},
		components: {
			musichead
		},
		onLoad(options) {
			uni.showLoading({
				title: '正在加载...',
				
			});
			list(options.listId).then((res) => {
				if (res[1].data.code == '200') {
					this.playlist = res[1].data.playlist
					this.privileges = res[1].data.privileges
					this.$store.commit('INIT_TOPLISTIDS', res[1].data.playlist.trackIds)
					this.isLoading = false
					uni.hideLoading()
				}
			})
		},
		methods: {
			handleToDetail(songId) {
				uni.navigateTo({
					url: '/pages/detail/detail?songId=' + songId
				});
			}
		},
		filters: {
			formatCount(value) {
				if( value >= 10000 && value < 100000000 ) {
					value /= 1000
					return value.toFixed(1) + '万'
				} else if ( value > 100000000 ) {
					value /= 100000000
					return value.toFixed(1) + '亿'
				} else {
					return value
				}
			}
		}
	}
</script>

<style scoped>
  .list-head {
		display: flex;
		margin: 30rpx;
	}
	.list-head-img {
		width: 264rpx;
		height: 264rpx;
		border-radius: 30rpx;
		overflow: hidden;
		position: relative;
		margin-right: 42rpx;
	}
	.list-head-img image {
		width: 100%;
		height: 100%;
	}
	.list-head-img text {
		position: absolute;
		right: 8rpx;
		top: 8rpx;
		color: #fff;
		font-size: 26rpx;
	}
	.list-head-text {
		flex: 1;
		color: #f0f2f7;
	}
	.list-head-text view:nth-child(1) {
		color: #fff;
		font-size: 34rpx;
	}
	.list-head-text view:nth-child(2) {
		display: flex;
		margin: 20rpx 0;
		font-size: 24rpx;
		align-items: center;
	}
	.list-head-text view:nth-child(2) image {
		width: 54rpx;
		height: 54rpx;
		border-radius: 50%;
		margin-right: 14rpx;
	}
	.list-head-text view:nth-child(3) {
		line-height: 34rpx;
		font-size: 22rpx;
	}
	
	.list-share {
		width: 330rpx;
		height: 74rpx;
		margin: 0 auto;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 37rpx;
		color: #fff;
		line-height: 74rpx;
		text-align: center;
		font-size: 28rpx;
	}
	.list-share text {
		margin-right: 16rpx;
	}
	
	.list-music {
		background: #fff;
		border-radius: 50rpx;
		margin-top: 40rpx;
		overflow: hidden;
	}
	.list-music-head {
		height: 50rpx;
		margin: 30rpx 0 70rpx 22rpx;
	}
	.list-music-head text:nth-child(1) {
		height: 50rpx;
		font-size: 50rpx;
	}
	.list-music-head text:nth-child(2) {
		font-size: 30rpx;
		margin: 0 10rpx 0 26rpx;
	}
	.list-music-head text:nth-child(3) {
		font-size: 26rpx;
		color: #b2b2b2;
	}
	.list-music-item {
		display: flex;
		margin: 0 32rpx 66rpx 46rpx;
		align-items: center;
		color: #959595;
	}
	.list-music-top {
		width: 58rpx;
		font-size: 30rpx;
		line-height: 50rpx;
	}
	.list-music-song {
	  flex: 1;
	}
	.list-music-song view:nth-child(1) {
		font-size: 28rpx;
		color: #000;
		width: 70vw;
		white-space: nowrap;  /* 规定内容连续向后展示,不会默认换行 */
		overflow: hidden;
		text-overflow: ellipsis;  /* 加省略号，配合overflow: hidden */
	}
	.list-music-song view:nth-child(2) {
		flex-wrap: wrap;  /* 正常换行 */
		font-size: 20rpx;
		align-items: center;
		width: 70vw;
		white-space: nowrap;  /* 规定内容连续向后展示,不会默认换行 */
		overflow: hidden;
		text-overflow: ellipsis;  /* 加省略号，配合overflow: hidden，不能配合弹性布局使用 */
	}
	.list-music-song view:nth-child(2) image {
		width: 32rpx;
		height: 20rpx;
		margin-right: 10rpx;
		/* flex-shrink: 0;  定义弹性盒子内部子元素的缩小比例,设置为0时就是不缩小,默认为1 */
	}
	.list-music-item text {
		font-size: 50rpx;
		color: #c7c7c7;
	}
</style>
