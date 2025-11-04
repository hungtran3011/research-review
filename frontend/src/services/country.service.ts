import type { World } from "../models/world";
import worldData from "../assets/world.json";

export async function getWorldData(): Promise<World[]> {
    return Promise.resolve(worldData as World[]);
}

