<template>
	<view class="detail">
		<view class="fixbg" :style="{ 'background-image' : 'url(' + songDetail.al.picUrl + ')' }"></view>
		<musichead :title="songDetail.name" :icon="true" color="white"></musichead>
		<view class="container" v-show="!isLoading">
			<scroll-view scroll-y="true">
				<view class="detail-play" @tap="handleToplay">
					<image :src="songDetail.al.picUrl" :class="{ 'detail-play-run': isPlayRotate }" mode=""></image>
					<text class="iconfont" :class="iconPlay"></text>
					<view></view>
				</view>
				
				<view class="detail-lyric">
					<view class="detail-lyric-wrap" :style="{ transform: 'translateY('+ -(lyricIndex - 1) * 82 +'rpx)' }">
						<view class="detail-lyric-item" :class="{ active: lyricIndex == index }" v-for="(item, index) in songLyric" :key="index">{{item.lyric}}</view>
					</view>
				</view>
				
				<view class="detail-like">
					<view class="detail-like-head">喜欢这首歌的人也听</view>
					<view class="detail-like-item" v-for="(item, index) in songSimi" :key="index" @tap="handleToSimi(item.id)">
						<view class="detail-like-img">
							<image :src="item.album.picUrl" mode=""></image>
						</view>
						<view class="detail-like-song">
							<view>{{ item.name }}</view>
							<view>
								<image v-if="item.privilege.flag > 60 && item.privilege.flag < 70 " src="@/static/dujia.png" mode=""></image>
								<image v-if="item.privilege.maxbr == 999000" src="@/static/sq.png" mode=""></image>
								{{ item.album.artists[0].name }} - {{ item.name }}
							</view>
						</view>
						<text class="iconfont icon-bofangqi-bofangshu"></text>
					</view>
				</view>
				
				<view class="detail-comment">
					<view class="detail-comment-head">精彩评论</view>
					<view class="detail-comment-item" v-for="(item, index) in songComment" :key="index">
						<view class="detail-comment-img">
							<image :src="item.user.avatarUrl"></image>
						</view>
						<view class="detail-comment-content">
							<view class="detail-comment-title">
								<view class="detail-comment-name">
									<view>{{ item.user.nickname }}</view>
									<view>{{ item.time | formatTime }}</view>
								</view>
								<view class="detail-comment-like">{{ item.likedCount | formatCount }} <text class="iconfont icon-dianzan"></text></view>
							</view>
							<view class="detail-comment-text">{{ item.content }}</view>
						</view>
					</view>
					
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import '@/common/iconfont.css'
	import musichead from '@/components/musichead/musichead.vue'
	import { songDetail, songSimi, songComment, songLyric, songUrl } from '@/common/api.js'
	export default {
		data() {
			return {
				songDetail: {
					name: '',
					al: {
						picUrl: ''
					}
				},
				songSimi: [],
				songComment: [],
				songLyric: [],
				lyricIndex: 0,
				iconPlay: 'icon-zanting',
				isPlayRotate: true,
				isLoading: true
			}
		},
		components: {
			musichead
		},
		onLoad(options) {
			this.getMusic(options.songId)
		},
		// 返回上一级时触发
		onUnload() {
			this.cancelLyricIndex()
			
			// #ifdef H5
			// 退出时销毁
			this.bgAudioMannager.destroy()
			// #endif
		},
		// 跳转为后台时触发
		onHide() {
			this.cancelLyricIndex()
			
			// #ifdef H5
			// 退出时销毁
			this.bgAudioMannager.destroy()
			// #endif
		},
		methods: {
			getMusic(songId) {
				
				this.$store.commit('NEXT_ID', songId)
				
				uni.showLoading({
					title: '加载中...'
				})
				this.isLoading = true
				
				Promise.all([ songDetail(songId), songSimi(songId), songComment(songId), songLyric(songId), songUrl(songId) ]).then((res) => {
					if (res[0][1].data.code == '200') {
						this.songDetail = res[0][1].data.songs[0]
					}
					if (res[1][1].data.code == '200') {
						this.songSimi = res[1][1].data.songs
					}
					if (res[2][1].data.code == '200') {
						this.songComment = res[2][1].data.hotComments
					}
					if (res[3][1].data.code == '200') {
						let lyric = res[3][1].data.lrc.lyric
						
						let re = /\[([^\]]+)\]([^\[]+)/g;
					  var result = []
						lyric.replace(re, ($0, $1, $2) => {
							result.push({ "time": this.formatTimeToSec($1), "lyric": $2 })
						})
						// 进行映射
						this.songLyric = result;
					}
					if (res[4][1].data.code == '200') {
						
						// #ifdef MP-WEIXIN
						this.bgAudioMannager = uni.getBackgroundAudioManager()
						this.bgAudioMannager.title = this.songDetail.name
						// #endif
						
						// #ifdef H5
						// 判断是否有其他已经播放的音乐
						if (!this.bgAudioMannager) {
							this.bgAudioMannager = uni.createInnerAudioContext()
						}
						this.iconPlay = 'icon-bofang'
						this.isPlayRotate = false
						// #endif
						
						
						this.bgAudioMannager.src = res[4][1].data.data[0].url || ''
						this.listLyricIndex()
						this.bgAudioMannager.onPlay(() => {
							this.iconPlay = 'icon-zanting'
							this.isPlayRotate = true
							this.listLyricIndex()
						})
						this.bgAudioMannager.onPause(() => {
              this.iconPlay = 'icon-bofang'
              this.isPlayRotate = false
							this.cancelLyricIndex()
						})
						// 监听歌曲播放结束
						this.bgAudioMannager.onEnded(() => {
							this.getMusic( this.$store.state.nextId )
						})
					}
					this.isLoading  = false
					uni.hideLoading()
				})
			},
			formatTimeToSec(value) {
				// 分钟和秒分隔开后存放到数组中
				var arr = value.split(':');
				// 先把数字进行操作，再进行toFixed转换，最后返回转换成秒的结果
				return (Number(arr[0]*60) + Number(arr[1])).toFixed(1)
			},
			handleToplay() {
				if (this.bgAudioMannager.paused) {
					this.bgAudioMannager.play()
				} else {
					this.bgAudioMannager.pause()
				}
			},
			listLyricIndex() {
				clearInterval(this.timer);
					// 监听歌词的变化,500毫秒监听一次
					this.timer = setInterval(()=>{
					// 歌词遍历
					for(var i=0;i<this.songLyric.length;i++){
						// 播放时间小于最后一条歌词的时候
						if( this.songLyric[this.songLyric.length-1].time < this.bgAudioMannager.currentTime ){
						  this.lyricIndex = this.songLyric.length-1;
						  break;
					  }
					  // 播放时间小于上一条歌词
					  if( this.songLyric[i].time < this.bgAudioMannager.currentTime && this.songLyric[i+1].time > this.bgAudioMannager.currentTime ){
						  this.lyricIndex = i;
					  }
					}
				}, 100);
			},
			cancelLyricIndex() {
				clearInterval(this.timer)
			},
			handleToSimi(songId) {
				this.getMusic(songId)
			}
		},
		filters: {
			formatCount(value) {
				if( value >= 10000 && value < 100000000 ) {
					value /= 10000
					return value.toFixed(1) + '万'
				} else if ( value > 100000000 ) {
					value /= 100000000
					return value.toFixed(1) + '亿'
				} else {
					return value
				}
			},
			formatTime(value) {
				var date = new Date(value)
				return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
			}
		}
	}
</script>

<style scoped>
	.detail-play {
		width: 580rpx;
		height: 580rpx;
		background: url(@/static/disc.png);
		background-size: cover;
		margin: 214rpx auto 0 auto;
		position: relative;
	}
	.detail-play image {
		width: 370rpx;
		height: 370rpx;
		border-radius: 50%;
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		margin: auto;
		animation: 10s linear move infinite;  /* 图片旋转 */
		animation-play-state: paused;  /* 规定动画暂停 */
	}
	.detail-play .detail-play-run {
		animation-play-state: running;  /* 规定动画运动 */
	}
	@keyframes move{
		from{
			transform: rotate(0deg);
		}
		to{
			transform: rotate(360deg);
		}
	}
	.detail-play text {
		font-size: 100rpx;
		color: #fff;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.detail-play view {
		width: 230rpx;
		height: 360rpx;
		background-image: url(@/static/needle.png);
		position: absolute;
		left: 0;
		right: 0;
		top: -200rpx;
		left: 100rpx;
		margin: auto;
		background-size: cover;
	}
	
	.detail-lyric {
		font-size: 32rpx;
		line-height: 82rpx;
		height: 246rpx;
		text-align: center;
		overflow: hidden;
		color: #6f6e73;
	}
	.detail-lyric-wrap {
		transition: .5s;
	}
	.detail-lyric-item {
		height: 82rpx;
	}
	.detail-lyric-item.active {
		color: #fff;
	}
	
	.detail-like {
		margin: 0 30rpx;
	}
	.detail-like-head {
		font-size: 36rpx;
		color: #fff;
		margin: 50rpx 0;
	}
	.detail-like-item {
		display: flex;
		align-items: center;
		margin-bottom: 28rpx;
	}
	.detail-like-img {
		width: 82rpx;
		height: 82rpx;
		border-radius: 20rpx;
		overflow: hidden;
		margin-right: 20rpx;
	}
	.detail-like-img image {
		width: 100%;
		height: 100%;
	}
	.detail-like-song {
		flex: 1;
		color: #c6c2bf;
	}
	.detail-like-song view:nth-child(1) {
		font-size: 28rpx;
		color: #fff;
		margin-bottom: 12rpx;
	}
	.detail-like-song view:nth-child(2) {
		font-size: 22rpx;
	}
	.detail-like-song image {
		width: 26rpx;
		height: 20rpx;
		margin-right: 10rpx;
	}
	.detail-like-item text {
		font-size: 50rpx;
		color: #c6c2bf;
	}
	
	.detail-comment {
		margin: 0 30rpx;
	}
	.detail-comment-head {
		font-size: 36rpx;
		color: #fff;
		margin: 50rpx 0;
	}
	.detail-comment-item {
		margin-bottom: 28rpx;
		display: flex;
	}
	.detail-comment-img {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 18rpx;
	}
	.detail-comment-img image {
		width: 100%;
		height: 100%;
	}
	.detail-comment-content {
		flex: 1;
		color: #cbcacf;
	}
	.detail-comment-title {
		display: flex;
		justify-content: space-between;
	}
	.detail-comment-name view:nth-child(1) {
		font-size: 26rpx;
	}
	.detail-comment-name view:nth-child(2) {
		font-size: 20rpx;
	}
	.detail-comment-like {
		font-size: 28rpx;
	}
	.detail-comment-text {
		font-size: 28rpx;
		line-height: 40rpx;
		color: #fff;
		margin-top: 20rpx;
		border-bottom: 1px solid #e0e0e0;
		padding-bottom: 40rpx;
	}
</style>
