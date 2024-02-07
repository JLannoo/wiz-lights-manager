import { networkInterfaces } from "node:os";
import dgram, { Socket } from "node:dgram";

export function getLocalIP() {
	const nets = networkInterfaces();
	const results: Record<string, string[]> = Object.create(null); // or just '{}', an empty object

	for (const name of Object.keys(nets)) {
		const net = nets[name];
		if(!net) continue;

		for (const netInterface of net) {
			// skip over non-ipv4 and internal
			if (netInterface.family === "IPv4" && !netInterface.internal) {
				if (!results[name]) {
					results[name] = [];
				}
				results[name].push(netInterface.address);
			}
		}
	}

	// Get Wifi IP
	const wifiIP = Object.entries(results).filter(([key, value]) => key.startsWith("Wi-Fi"));
	if(wifiIP) {
		return wifiIP[0][1][0];
	}

	// Get Ethernet IP
	const ethernetIP = Object.keys(results).filter((key) => key.startsWith("Ethernet"));
	if(ethernetIP) {
		return ethernetIP[0];
	}

	// Get any IP
	for (const name of Object.keys(results)) {
		const net = results[name];
		if(!net) continue;

		return net[0];
	}

	return "";
}

export async function awaitResponse(socket: Socket, timeout: number): Promise<{msg: Buffer, rinfo: any}> {
	return new Promise((resolve, reject) => {
		socket.on("message", (msg , rinfo) => {
			resolve({msg, rinfo});
		});

		socket.on("error", (err) => {
			reject(err);
		});

		setTimeout(() => {
			reject(new Error("Timeout"));
		}, timeout);
	});
}

export async function sendAndAwaitResponse(message: string, ip: string, port: number, timeout: number) {
	try {
		const server = dgram.createSocket("udp4");
		server.send(message, port, ip);

		const {msg, rinfo} = await awaitResponse(server, timeout);

		server.close();

		return {msg, rinfo};
	} catch (error) {
		return null;
	}
}