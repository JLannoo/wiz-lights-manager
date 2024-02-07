# Wiz Lights Manager
A Typescript library to manage [Wiz Smart Lights](https://www.wizconnected.com/).

It uses the internal UPD API of the Wiz Lights to control them. This library is not affiliated with Wiz and may not work for all firmware versions, API versions, light models, etc.

## Features
- Discover Wiz Lights on the local network
- Control Wiz Lights (on/off, brightness, color, etc.)
- Group Wiz Lights
- Define custom scenes

## Installation
```bash
npm install wiz-lights-manager
```

## Usage
```typescript
import { WizLightManager } from 'wiz-lights-manager';

const manager = new WizLightManager();

/**
 * IMPORTANT: This must be called before any other methods (obviously)
 * 
 * Finds all Wiz Lights on the local network
 * Loads cached lights if available
 * Initializes each light, loading its state
 */
await manager.init();

/**
 * Interact with all lights
 */
await manager.allLights.lightSwitch(true/false);
await manager.allLights.setBrightness(100);
await manager.allLights.setColor({ temp: 2700 });
await manager.allLights.setScene('Romantic');

/**
 * Set the color of all lights
 */
await manager.allLights.setColor({
    // Can use RGB
    r: 255,
    g: 0,
    b: 0,
    // Temperature
    temp: 2700,
    // Or Cold/Warm
    c: 0,
    w: 255
});

/**
 * Interact with groups and set alieses for their IDs
 * Groups are automatically created based on the group they have been assigned to in the Wiz app
 */
manager.lightGroups[ID1]?.setAlias('Living Room');
manager.lightGroups[ID2]?.setAlias('Bedroom');
await manager.getGroupByAlias('Living Room')?.lightSwitch(true);
await manager.getGroupByAlias('Bedroom')?.setColor({ temp: 2700 });

/**
 * Create a custom scene by defining a procedure to run
 */
manager.createScene('Custom Name', async (manager) => {
    await manager.allLights.lightSwitch(true);
    await manager.allLights.setColor({ temp: 2700 });
    ...
});

await manager.runCustomScene('Custom Name');
```


