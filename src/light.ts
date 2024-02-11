import { type ColorState, messenger, SceneModeColor } from "./messenger";
import { sendAndAwaitResponse } from "./network";
import { SCENES } from "./consts/scenes";

const LAMPS_PORT = 38899;

export type WizLightState = (ColorState | SceneModeColor) & {
	state: boolean,
	dimming: number,
};

export type WizLightSystemConfig = {
	mac: string,
	homeId: string,
	roomId: string,
	groupId: string,
}

export interface WizLight {
	init(): Promise<void>;

	sendMessage(message: string): Promise<{msg: string, rinfo: any} | undefined>;
	setState(params: WizLightState): Promise<void>;
	setColor(params: ColorState): Promise<void>;
	setBrightness(brightness: number): Promise<void>;
	setScene(scene: keyof typeof SCENES | number, speed?: number): Promise<void>;
	setSpeed(speed: number): Promise<void>;
	turnOff(): Promise<void>;
	turnOn(): Promise<void>;
	
	getState(): Promise<WizLightState>;
	getUserConfig(): Promise<any>;
	getSystemConfig(): Promise<any>;

	logger: (...args: any[]) => void;
}

export class WizLight implements WizLight {
	ip: string;
	colorState: WizLightState;
	systemConfig?: WizLightSystemConfig;

	rssi: number;

	constructor(ip: string, state: WizLightState, rssi: number, systemConfig?: WizLightSystemConfig){
		this.ip = ip;
		this.colorState = state;
		this.rssi = rssi;
		this.systemConfig = systemConfig;

		this.logger = console.log.bind(null, `\x1b[35m[${this.constructor.name}]\x1b[0m \x1b[33m[${this.ip}]\x1b[0m`);
	}

	async init(){
		this.logger("Initializing");

		// Raise an error if the light is not reachable
		await Promise.all([
			this.getState(),
			this.getSystemConfig(),
		]);
	}

	async sendMessage(message: string){
		this.logger("Sending message", message);
		const response = await sendAndAwaitResponse(message, this.ip, LAMPS_PORT, 1000);
		if(response){
			return {
				msg: response.msg.toString(),
				rinfo: response.rinfo,
			};
		}

		this.logger("No response");

		throw new Error(this.ip);
	}

	async setState(params: Partial<WizLightState>){
		// If the sceneId is 0, the API will return an error
		// but sometimes it returns 0 and gets stored in the state
		// so we need to remove before sending the message to the light
		if("sceneId" in params && params.sceneId === 0){
			delete params.sceneId;
		}

		this.colorState = {
			...this.colorState,
			// Any state change will turn the light on
			state: true,
			...params,
		};

		const message = messenger.setPilotMessage(params);
		await this.sendMessage(message);
	}

	async setColor(params: ColorState){
		if(this.colorState){
			await this.setState({
				...params,
			});
		}
	}

	async setBrightness(brightness: number){
		if(this.colorState){			
			await this.setState({ dimming: brightness });
		}
	}

	async setScene(scene: keyof typeof SCENES | number, speed = 100){
		if(this.colorState){
			await this.setState({
				sceneId: typeof scene === "string" ? SCENES[scene] : scene,
				speed,
			});
		}
	}

	async setSpeed(speed: number){
		if(this.colorState){
			await this.setState({ speed });
		}
	}

	async turnOff(){
		await this.setState({ state: false });
	}

	async turnOn(){
		await this.setState({ state: true });
	}


	async getState(){
		const response = await this.sendMessage(messenger.getPilotMessage());
		
		if(response){
			const state = JSON.parse(response.msg).result;
			const { rssi, mac, src, ...rest } = state;
			this.colorState = rest;
			
			return state;
		}
	}

	async getUserConfig(){
		const response = await this.sendMessage(messenger.getUserConfigMessage());
		
		if(response){
			return JSON.parse(response.msg).result;
		}
	}

	async getSystemConfig(){
		const response = await this.sendMessage(messenger.getSystemConfigMessage());
		
		if(response){
			const state = JSON.parse(response.msg).result;
			
			this.systemConfig = state;

			return state;
		}
	}
}