const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const ytdl = require('ytdl-core')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const videoTemp = path.resolve(__dirname, 'videoTemp.mp4')
const audioTemp = path.resolve(__dirname, 'audioTemp.mp4')
const movieTemp = path.resolve(__dirname, 'movieTemp.mov')

const fileExists = link =>
	new Promise((resolve, reject) =>
		fs.access(link, fs.constants.F_OK, err => {
			if (err) {
				return resolve(false)
			}
			return resolve(true)
		})
	)

const videoDownload = (info, options, link) =>
	new Promise((resolve, reject) => {
		const stream = fs.createWriteStream(link).on('close', resolve).on('error', reject)
		ytdl.downloadFromInfo(info, options).pipe(stream)
	})

const deleteTempFile = async () => {
	if (await fileExists(videoTemp)) {
		await fsp.unlink(videoTemp)
	}

	if (await fileExists(audioTemp)) {
		await fsp.unlink(audioTemp)
	}

	if (await fileExists(movieTemp)) {
		await fsp.unlink(movieTemp)
	}
}

module.exports = async (videoUrl, audio) => {
	await deleteTempFile()

	const videoInfo = await ytdl.getInfo(videoUrl)
	const audioInfo = await ytdl.getInfo(videoUrl)
	ytdl.chooseFormat(audioInfo.formats, {quality: '140'})

	await videoDownload(videoInfo, {quality: 'highestvideo'}, videoTemp)

	if (audio === true) {
		await videoDownload(audioInfo, {quality: '140'}, audioTemp)
	}

	await exec(
		`ffmpeg -i ${videoTemp} -vcodec dnxhd -acodec pcm_s16le -s 1920x1080 -profile:v dnxhr_hq -r 30000/1001 -pix_fmt yuv422p -f mov ${movieTemp}`
	)

	const title = videoInfo.playerResponse.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '')
	const finalFile = path.resolve(__dirname, `./videoFiles/${title}.mov`)

	const finalFileExists = await fileExists(finalFile)

	if (finalFileExists === true) {
		await fsp.unlink(finalFile)
	}

	if (audio === true) {
		await exec(`ffmpeg -i ${movieTemp} -i ${audioTemp} -map 0:v -map 1:a -c:v copy -shortest ${finalFile}`)
	} else {
		await fsp.rename(movieTemp, finalFile)
	}

	await deleteTempFile()
	return finalFile
}
