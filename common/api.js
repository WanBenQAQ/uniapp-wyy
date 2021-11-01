import { baseUrl } from './config.js'

export function topList() {
	var listIds = ['19723756' , '3779629' , '2884035' , '3778678'];
	return new Promise(function (reslove, reject) {
		uni.request({
			url: `${baseUrl}/toplist/detail`,
			method: 'GET',
			data: {},
			success: res => {
				let result = res.data.list
				result.length = 4
				for(let i = 0; i < listIds.length; i++) {
					result[i].listId = listIds[i]
				}
				reslove(result)
			},
			fail: () => {},
			complete: () => {}
		})
	})
}

export function list(listId) {
	return uni.request({
		url: `${baseUrl}/playlist/detail?id=${listId}`,
		method: 'GET'
	})
}