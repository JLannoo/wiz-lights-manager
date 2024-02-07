import { WizLightManager } from "./manager";

type CustomSceneProcedure = (manager: WizLightManager) => Promise<void>;

export interface CustomScene {
    activate(): Promise<void>;

    logger: (...args: any[]) => void;
}

export class CustomScene implements CustomScene {
	private procedure: CustomSceneProcedure;
	private manager: WizLightManager;
    
	name: string;

	constructor(manager: WizLightManager, name: string, procedure: CustomSceneProcedure){
		this.name = name;
		this.manager = manager;
		this.procedure = procedure;
        
		this.logger = console.log.bind(null, `\x1b[35m[${this.constructor.name}]\x1b[0m \x1b[33m[${this.name}]\x1b[0m`);
	}

	async activate(){
		this.logger("Activating");
		await this.procedure(this.manager);
	}
}