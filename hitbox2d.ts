// hitbox2d.ts
/*!
MIT License

Copyright (c) 2016 Yahiko
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

namespace Motion2D {
    export const enum HitboxStrength { WEAK, STRONG };

    export abstract class Hitbox {
        strength: HitboxStrength;
        abstract getDistToPoint(point: G2D.Point): number;
        abstract getDistToHitbox(hitbox: Hitbox): number;
        abstract getNormalVector(point: G2D.Point): G2D.Vector;
    } // Hitbox

    export class HitboxRect extends Hitbox implements G2D.AARectangle {
        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x: number, y: number, width: number, height: number, strength: HitboxStrength = HitboxStrength.STRONG) {
            super();
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.strength = strength;
        } // constructor

        getDistToPoint(point: G2D.Point): number {
            return G2D.distPointToRect(point, this);
        } // getDistToPoint

        getDistToHitbox(hitbox: Hitbox): number {
            if (hitbox instanceof HitboxRect) {
                let ul = { x: hitbox.x, y: hitbox.y };
                let ur = { x: hitbox.x + hitbox.width, y: hitbox.y };
                let bl = { x: hitbox.x, y: hitbox.y + hitbox.height };
                let br = { x: hitbox.x + hitbox.width, y: hitbox.y + hitbox.height };
                return Math.min(this.getDistToPoint(ul), this.getDistToPoint(ur), this.getDistToPoint(bl), this.getDistToPoint(br));
            }
            else if (hitbox instanceof HitboxCircle) {
                return this.getDistToPoint(hitbox) - hitbox.radius;
            }
            return -1;
        } // getDistToHitbox

        getNormalVector(point: G2D.Point): G2D.Vector {
            // TO IMPLEMENT
            return { x: 0, y: 0 };
        } // getNormalVector
    } // HitboxRect

    export class HitboxCircle extends Hitbox implements G2D.Circle {
        x: number;
        y: number;
        radius: number;

        constructor(x: number, y: number, radius: number, strength: HitboxStrength = HitboxStrength.STRONG) {
            super();
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.strength = strength;
        } // constructor

        getDistToPoint(point: G2D.Point): number {
            return G2D.distPointToCircle(point, this);
        } // getDistToPoint

        getDistToHitbox(hitbox: Hitbox): number {
            if (hitbox instanceof HitboxRect) {
                return hitbox.getDistToPoint(this) - this.radius;
            }
            else if (hitbox instanceof HitboxCircle) {
                return hitbox.getDistToPoint(this) - this.radius;
            }
            return -1;
        } // getDistToHitbox

        getNormalVector(point: G2D.Point): G2D.Vector {
            let dx = point.x - this.x;
            let dy = point.y - this.y;
            let norm = Math.sqrt(dx * dx + dy * dy);
            return { x: dx / norm, y: dy / norm };
        } // getNormalVector
    } // HitboxCircle

    export function isCollisionCircleToCircle(hitbox1: HitboxCircle, move1: G2D.Vector, hitbox2: HitboxCircle, move2: G2D.Vector): boolean {
        let nextH1 = {
            x: hitbox1.x + move1.x,
            y: hitbox1.y + move1.y,
            radius: hitbox1.radius
        };
        let nextH2 = {
            x: hitbox2.x + move2.x,
            y: hitbox2.y + move2.y,
            radius: hitbox2.radius
        };
        return G2D.circleToCircleOverlap(nextH1, nextH2);
    } // isCollisionCircleToCircle

    export function isCollisionCircleToRect(hitbox1: HitboxCircle, move1: G2D.Vector, hitbox2: HitboxRect, move2: G2D.Vector): boolean {
        let nextH1 = {
            x: hitbox1.x + move1.x,
            y: hitbox1.y + move1.y,
            radius: hitbox1.radius
        };
        let nextH2 = {
            x: hitbox2.x + move2.x,
            y: hitbox2.y + move2.y,
            width: hitbox2.width,
            height: hitbox2.height
        };
        return G2D.circleToRectOverlap(nextH1, nextH2);
    } // isCollisionCircleToRect

    export function isCollisionRectToRect(hitbox1: HitboxRect, move1: G2D.Vector, hitbox2: HitboxRect, move2: G2D.Vector): boolean {
        let nextH1 = {
            x: hitbox1.x + move1.x,
            y: hitbox1.y + move1.y,
            width: hitbox1.width,
            height: hitbox1.height
        };
        let nextH2 = {
            x: hitbox2.x + move2.x,
            y: hitbox2.y + move2.y,
            width: hitbox2.width,
            height: hitbox2.height
        };
        return G2D.rectToRectOverlap(nextH1, nextH2);
    } // isCollisionRectToRect

    export function isCollision(hitbox1: Hitbox, move1: G2D.Vector, hitbox2: Hitbox, move2: G2D.Vector): boolean {
        if (hitbox1 instanceof HitboxCircle) {
            if (hitbox2 instanceof HitboxCircle) {
                return isCollisionCircleToCircle(hitbox1, move1, hitbox2, move2);
            }
            else if (hitbox2 instanceof HitboxRect) {
                return isCollisionCircleToRect(hitbox1, move1, hitbox2, move2);
            }
        }
        else if (hitbox1 instanceof HitboxRect) {
            if (hitbox2 instanceof HitboxCircle) {
                return isCollisionCircleToRect(hitbox2, move2, hitbox1, move1);
            }
            else if (hitbox2 instanceof HitboxRect) {
                return isCollisionRectToRect(hitbox1, move1, hitbox2, move2);
            }
        }
        return false;
    } // isCollision
} // Motion2D
