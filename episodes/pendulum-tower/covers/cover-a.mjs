// Cover candidate a (no text, no image generation): the real scene frozen at t=0.8 s, exactly as in the film.
import {build as buildMain} from '../scene2/main.mjs';
export const authored=true;
export async function build(ctx,o){const m=await buildMain(ctx,o);return {...m,update(){return m.update(0.8);}};}
