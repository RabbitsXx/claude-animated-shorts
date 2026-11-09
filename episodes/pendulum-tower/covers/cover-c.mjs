// Cover candidate c (no text, no image generation): the real scene frozen at t=14.6 s, exactly as in the film.
import {build as buildMain} from '../scene2/main.mjs';
export const authored=true;
export async function build(ctx,o){const m=await buildMain(ctx,o);return {...m,update(){return m.update(14.6);}};}
