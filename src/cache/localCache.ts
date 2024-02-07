import fs from "node:fs";

import { WizLight } from "../light";

export interface LightCache {
    load(): Promise<WizLight[] | undefined>;
    save(lights: WizLight[]): Promise<void>;
    
    flush(): Promise<void>;
    clear(): Promise<void>;
}

export class LocalCache implements LightCache {
	private path: string;
	private logger: (...args: any[]) => void;

	cache: WizLight[] = [];

	constructor(path: string){
		this.path = path;
		this.logger = console.log.bind(null, `\x1b[35m[${this.constructor.name}]\x1b[0m`);
	}

	async load(){
		this.logger(`Loading cache from '${this.path}'`);
		if(fs.existsSync(this.path)){
			const data = fs.readFileSync(this.path, "utf8");
			
			this.cache = JSON.parse(data);
			
			const lights: WizLight[] = [];
			for(const light of this.cache){
				const newLight = new WizLight(light.ip, light.colorState, light.rssi);

				lights.push(newLight);
			}

			this.logger(`Loaded ${lights.length} lights from cache`);

			return lights;
		}

		this.logger("Cache file not found");
	}
    
	async save(lights: WizLight[]){
		this.logger(`Saving cache to '${this.path}'`);
		const data = JSON.stringify(lights);
		fs.writeFileSync(this.path, data);
	}

	async flush(){
		this.logger("Flushing cache");
		this.cache = [];
	}

	async clear(){
		this.logger("Clearing cache");
		if(fs.existsSync(this.path)){
			fs.writeFileSync(this.path, "");
		}
	}
}