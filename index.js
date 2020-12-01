const videoDownload = require('./videoDownload')
const [url, audio = 'true'] = process.argv.slice(2)

if (typeof url === 'undefined') {
	throw new Error('YouTube url undefined')
}

videoDownload(url, audio === 'true')
.then(process.exit)
.catch(err => {
	throw err
})
