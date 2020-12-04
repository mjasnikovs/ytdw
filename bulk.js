const fs = require('fs')
const path = require('path')
const {sync} = require('scpp')
const {spawn} = require('child_process')

const VIDEO_TXT = path.resolve(__dirname, 'videos.txt')
const PARSER = path.resolve(__dirname, 'index.js')

sync(
	[
		cb => {
			fs.readFile(VIDEO_TXT, 'utf-8', (err, result) => {
				if (err) {
					return cb(new Error(err))
				}
				return cb(
					null,
					result.split(/\r?\n/).map(str => str.trim())
				)
			})
		},
		(cb, videos) => {
			sync(
				videos.map(val => {
					return (video => {
						return cbS => {
							console.log(video)
							const child = spawn('node', [PARSER, video, false])
							let out = ''
							let err = ''
							child.stdout.on('data', data => out + data.toString())
							child.stderr.on('data', data => err + data.toString())
							child.on('close', () => {
								if (err !== '') {
									return cbS(new Error(err))
								}
								return cbS(null, out)
							})
						}
					})(val)
				}),
				cb
			)
		}
	],
	(err, result) => {
		console.log({err, result})
		if (err) {
			console.error(err)
		}
		console.log(result)
	}
)
