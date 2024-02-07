import { SCENES } from "./consts/scenes";
import { WizLight } from "./light";
import { ColorState } from "./messenger";

export interface LightGroup {
	setAlias(alias: string): void;

    lightSwitch(state: boolean): void;
    setBrightness(dimming: number): void;
    setColor(params: ColorState): void;
    setScene(sceneId: keyof typeof SCENES | number, speed: number): void;

    logger: (message: string, ...args: any[]) => void;
}

export class LightGroup implements LightGroup {
	lights: WizLight[] = [];
	alias: string;

	constructor(lights: WizLight[], alias: string){
		this.lights = lights;
		this.alias = alias;

		this.logger = console.log.bind(null, `\x1b[35m[${this.constructor.name}]\x1b[0m \x1b[33m[${this.alias}]\x1b[0m`);
	}

	setAlias(alias: string){
		this.alias = alias;
		this.logger = console.log.bind(null, `\x1b[35m[${this.constructor.name}]\x1b[0m \x1b[33m[${this.alias}]\x1b[0m`);
	}

	/**
	 * Toggles the lights on or off
	 */
	async lightSwitch(state: boolean){
		this.logger(`Turning lights ${state ? "on" : "off"}`);

		for(const light of this.lights){
			state ? light.turnOn() : light.turnOff();
		}
	}

	/**
	 * Sets the brightness of the lights
	 */
	async setBrightness(dimming: number){
		this.logger(`Setting brightness to ${dimming}`);

		for(const light of this.lights){
			light.setBrightness(dimming);
		}
	}

	/**
	 * Sets the color of the lights
	 */
	async setColor(params: ColorState){
		this.logger(`Setting color to ${JSON.stringify(params)}`);

		for(const light of this.lights){
			light.setColor(params);
		}
	}

	/**
	 * Sets the scene of the lights
	 */
	async setScene(sceneId: keyof typeof SCENES | number, speed = 100){
		this.logger(`Setting scene to ${sceneId}`);

		for(const light of this.lights){
			light.setScene(sceneId, speed);
		}
	}
}