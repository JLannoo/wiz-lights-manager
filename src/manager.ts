import { getLocalIP, sendAndAwaitResponse } from "./network";
import { WizLight } from "./light";
import { messenger } from "./messenger";
import { LightCache } from "./cache/localCache";
import { LightGroup } from "./group";
import { CustomScene } from "./customScene";

const LAMPS_PORT = 38899;

export interface WizLightManager {
    searchLampsInNetwork(timeout?: number): Promise<LightGroup>;

	getLightByIP(ip: string): WizLight | undefined;
	getLightByAlias(alias: string): WizLight | undefined;

	getLightsByGroup(): Record<string, LightGroup>;
	getGroupByAlias(alias: string): LightGroup | undefined;
	
	getLightsByRooms(): Record<string, LightGroup>;
	getRoomByAlias(alias: string): LightGroup | undefined;

	createCustomScene(name: string, procedure: (manager: WizLightManager) => Promise<void>): void;
	runCustomScene(name: string): Promise<void>;

	logger: (...args: unknown[]) => void;
}

/**
 * A class to manage Wiz Smart Lights
 */
export class WizLightManager implements WizLightManager {
	private localIP: string;
	private cache?: LightCache;

	allLights: LightGroup = new LightGroup([], "all");
	lightGroups: Record<string, LightGroup> = {};
	rooms: Record<string, LightGroup> = {};
	customScenes?: CustomScene[];
	
	constructor(cache?: LightCache){
		this.localIP = getLocalIP();
		this.cache = cache;
		
		this.logger = console.log.bind(null, `\x1b[35m[${this.constructor.name}]\x1b[0m`);
	}

	/**
	 * Initializes the manager by loading cached lights, searching for lamps in the network,
	 * saving lights to cache if necessary, and initializing each light.
	 */
	async init(){
		const cachedLights = await this.cache?.load();
		if (cachedLights?.length) {
			this.allLights = new LightGroup(cachedLights, "all");
		}

		await this.searchLampsInNetwork();

		if(cachedLights?.length != this.allLights.lights.length){
			await this.cache?.save(this.allLights.lights);
		}

		const results = await Promise.allSettled(this.allLights.lights.map(light => light.init()));		
		const failed = results.filter(result => result.status === "rejected") as PromiseRejectedResult[];

		// Remove failed lights from the cache and the list of lights
		if(failed.length){
			const failedIPs = failed.map(result => result.reason);
			
			this.allLights.lights = this.allLights.lights.filter(light => {console.log(light.ip); return !failedIPs.includes(light.ip);});
			await this.cache?.save(this.allLights.lights);
		}

		this.logger(`Initialized with ${this.allLights.lights.length} lights`);
		this.logger(`Failed to initialize ${failed.length} lights (${failed.map(result => result.reason)})`);

		this.lightGroups = this.getLightsByGroup();
		this.rooms = this.getLightsByRooms();
	}

	/**
	 * Searches for lights in the network.
	 */
	async searchLampsInNetwork(timeout = 1000) {
		this.logger("Searching for lights in network");
		const IP_BASE = this.localIP.split(".").slice(0, 3).join(".");
		const message = messenger.getPilotMessage();

		const promises = [];
		
		for(let i = 1; i < 255; i++){
			const IP = `${IP_BASE}.${i}`;
			promises.push(sendAndAwaitResponse(message, IP, LAMPS_PORT, timeout));
		}

		const responses = await Promise.all(promises);

		const lights = [];

		for(const response of responses){
			if(response){				
				const ip = response.rinfo.address;
				const state = JSON.parse(response.msg.toString()).result;

				const { rssi, mac, src, ...rest } = state;

				const light = new WizLight(ip, rest, rssi);
				
				lights.push(light);
			}
		}

		this.allLights = new LightGroup(lights, "all");

		this.logger(`Found ${this.allLights.lights.length} lights in network`);

		return this.allLights;
	}

	/**
	 * Groups lights by their group ID
	 */
	getLightsByGroup(){
		const groups: Record<string, LightGroup> = {};

		for(const light of this.allLights.lights){
			const group = light.systemConfig?.groupId;

			if(group){
				if(!groups[group]){
					groups[group] = new LightGroup([], group);
				}

				groups[group].lights.push(light);
			} else {
				groups["ungrouped"] = groups["ungrouped"] || new LightGroup([], "ungrouped");
				groups["ungrouped"].lights.push(light);
			}
		}

		return groups;
	}

	/**
	 * Returns a group by its previously set alias
	 */
	getGroupByAlias(alias: string){
		for(const group of Object.values(this.lightGroups)){
			if(group.alias === alias){
				return group;
			}
		}
	}


	/**
	 * Groups lights by their room ID
	 */
	getLightsByRooms(){
		const rooms: Record<string, LightGroup> = {};

		for(const light of this.allLights.lights){
			const room = light.systemConfig?.roomId;

			if(room){
				if(!rooms[room]){
					rooms[room] = new LightGroup([], room);
				}

				rooms[room].lights.push(light);
			}
		}

		return rooms;
	}

	/**
	 *	Returns a room by its previously set alias
	 */
	getRoomByAlias(alias: string){
		for(const room of Object.values(this.rooms)){
			if(room.alias === alias){
				return room;
			}
		}
	}

	/**
	 * Returns a light by its IP
	 */
	getLightByIP(ip: string){
		return this.allLights.lights.find(light => light.ip === ip);
	}

	/**
	 * Returns a light by its alias
	 */
	getLightByAlias(alias: string){
		return this.allLights.lights.find(light => light.alias === alias);
	}

	/**
	 * Creates a custom scene
	 */
	createCustomScene(name: string, procedure: (manager: WizLightManager) => Promise<void>){
		this.customScenes = this.customScenes || [];
		this.customScenes.push(new CustomScene(this, name, procedure));
	}

	/**
	 * Runs a custom scene
	 */
	async runCustomScene(name: string){
		const scene = this.customScenes?.find(scene => scene.name === name);

		if(!scene){
			this.logger(`Scene '${name}' not found`);
			this.logger(`Available scenes: ${this.customScenes?.map(scene => scene.name).join(", ")}`);
		}

		await scene?.activate();
	}
}