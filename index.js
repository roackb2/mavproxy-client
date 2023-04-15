const Promise = require('bluebird')
const net = require('net')
const { mavlink20: mavlink, MAVLink20Processor: MAVLink } = require('mavlinkjs/mavlink_all_v2')

const LOGGER = null
const SYS_ID = 0 // broadcast
const COMP_ID = 0 // broadcast

const parser = new MAVLink(LOGGER, SYS_ID, COMP_ID)
parser.on('message', function(msg) {
    if (msg && msg.name) {
        handleMsg(msg)
    }
})

var client = new net.Socket()

client.on('data', function(data) {
    parser.parseBuffer(data)
})

client.on('close', function() {
	console.info('Connection closed')
})

function sendGpsGlobalOrigin(lat, lon, alt) {
    console.info(`sending set home`)
    let request = new mavlink.messages.set_gps_global_origin(1, lat, lon, alt, 0)
    let content = Buffer.from(request.pack(parser))
    client.write(content)
}


function sendArm() {
    console.info(`sending arm`)
    let request = new mavlink.messages.command_long(SYS_ID, COMP_ID, mavlink.MAV_CMD_COMPONENT_ARM_DISARM, 0, 1, 0, 0, 0, 0, 0, 0)
    let content = Buffer.from(request.pack(parser))
    client.write(content)
}

function handleMsg(msg) {
    switch (msg.name) {
        case 'GPS_GLOBAL_ORIGIN':
            console.info(msg)
            break
        case 'HEARTBEAT':
            console.info(msg)
            break
        default:

    }
}

async function run() {
    // Connects to MAVProxy default port on localhost
    client.connect(5762, '127.0.0.1', async function() {
    	console.info('Connected')
        await Promise.delay(1000)
        sendGpsGlobalOrigin(0.00001, 0.00001, 1)
        await Promise.delay(1000)
        sendArm()
    })
}

run().catch(err => {console.info(err)})
