export type BaseSetPilotParams = {
    state: boolean,
    /**
     * Brightness from 10 to 100
     */
    dimming: number,
}

export type RGBColor = {
    /**
     * Red from 0 to 255
     */
    r: number,
    /**
     * Green from 0 to 255
     */
    g: number,
    /**
     * Blue from 0 to 255
     */
    b: number,
}

export type TempColor = {
    /**
     * Temperature from 2700 to 6500
     */
    temp: number,
}

export type CoolWarmColor = {
    /**
     * Strength of the cool white from 0 to 255
     */
    c: number,
    /**
     * Strength of the warm white from 0 to 255
     */
    w: number,
}

export type SceneModeColor = {
    sceneId: number,
    /**
     * Speed from 0 to 100
     */
    speed: number,
}

export type ColorState = RGBColor | TempColor | CoolWarmColor;
export type SetPilotParams = BaseSetPilotParams & (ColorState | SceneModeColor);

export interface Messenger {
    getPilotMessage(): string;
    setPilotMessage(params: SetPilotParams): string;
    getUserConfigMessage(): string;
    getSystemConfigMessage(): string;
}

export class Messenger {
	getPilotMessage(){
		return JSON.stringify({
			"method": "getPilot",
			"params": {},
		});
	}

	setPilotMessage(params: Partial<SetPilotParams>){
		return JSON.stringify({
			"method": "setPilot",
			"params": params,
		});
	}

	getUserConfigMessage(){
		return JSON.stringify({
			"method": "getUserConfig",
			"params": {},
		});
	}

	getSystemConfigMessage(){
		return JSON.stringify({
			"method": "getSystemConfig",
			"params": {},
		});
	}
}

export const messenger = new Messenger();