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
    export type Hitbox = G2D.AARect | G2D.AABox | G2D.Circle;

    export function isCollisionCircleToCircle(hitbox1: G2D.Circle, move1: G2D.Vector, hitbox2: G2D.Circle, move2: G2D.Vector): boolean {
        return G2D.circleToCircleOverlap(G2D.translateCircle(hitbox1, move1), G2D.translateCircle(hitbox2, move2));
    } // isCollisionCircleToCircle

    export function isCollisionCircleToAARect(hitbox1: G2D.Circle, move1: G2D.Vector, hitbox2: G2D.AARect, move2: G2D.Vector): boolean {
        return G2D.circleToAARectOverlap(G2D.translateCircle(hitbox1, move1), G2D.translateAARect(hitbox2, move2));
    } // isCollisionCircleToRect

    export function isCollisionCircleToAABox(hitbox1: G2D.Circle, move1: G2D.Vector, hitbox2: G2D.AABox, move2: G2D.Vector): boolean {
        return G2D.circleToAABoxOverlap(G2D.translateCircle(hitbox1, move1), G2D.translateAABox(hitbox2, move2));
    } // isCollisionCircleToAABox

    export function isCollisionAABoxToAABox(hitbox1: G2D.AABox, move1: G2D.Vector, hitbox2: G2D.AABox, move2: G2D.Vector): boolean {
        return G2D.aaBoxToBoxOverlap(G2D.translateAABox(hitbox1, move1), G2D.translateAABox(hitbox2, move2));
    } // isCollisionAABoxToAABox

    export function isCollisionAABoxToAARect(hitbox1: G2D.AABox, move1: G2D.Vector, hitbox2: G2D.AARect, move2: G2D.Vector): boolean {
        return G2D.aaBoxToBoxOverlap(G2D.translateAABox(hitbox1, move1), G2D.translateAABox(G2D.aaRectToBox(hitbox2), move2));
    } // isCollisionAABoxToAABox

    export function isCollisionAARectToAARect(hitbox1: G2D.AARect, move1: G2D.Vector, hitbox2: G2D.AARect, move2: G2D.Vector): boolean {
        return G2D.aaRectToRectOverlap(G2D.translateAARect(hitbox1, move1), G2D.translateAARect(hitbox2, move2));
    } // isCollisionRectToRect

    export function isCollision(hitbox1: Hitbox, move1: G2D.Vector, hitbox2: Hitbox, move2: G2D.Vector): boolean {
        if (G2D.isCircle(hitbox1)) {
            if (G2D.isCircle(hitbox2)) {
                return isCollisionCircleToCircle(hitbox1, move1, hitbox2, move2);
            }
            else if (G2D.isAABox(hitbox2)) {
                return isCollisionCircleToAABox(hitbox1, move1, hitbox2, move2);
            }
            else if (G2D.isAARect(hitbox2)) {
                return isCollisionCircleToAARect(hitbox1, move1, hitbox2, move2);
            }
        }
        if (G2D.isAABox(hitbox1)) {
            if (G2D.isCircle(hitbox2)) {
                return isCollisionCircleToAABox(hitbox2 as G2D.Circle, move1, hitbox1 as G2D.AABox, move2);
            }
            else if (G2D.isAABox(hitbox2)) {
                return isCollisionAABoxToAABox(hitbox1 as G2D.AABox, move1, hitbox2 as G2D.AABox, move2);
            }
            else if (G2D.isAARect(hitbox2)) {
                return isCollisionAABoxToAARect(hitbox1 as G2D.AABox, move1, hitbox2 as G2D.AARect, move2);
            }
        }
        else if (G2D.isAARect(hitbox1)) {
            if (G2D.isCircle(hitbox2)) {
                return isCollisionCircleToAARect(hitbox2 as G2D.Circle, move2, hitbox1 as G2D.AARect, move1);
            }
            else if (G2D.isAABox(hitbox2)) {
                return isCollisionAABoxToAARect(hitbox2 as G2D.AABox, move1, hitbox1 as G2D.AARect, move2);
            }
            else if (G2D.isAARect(hitbox2)) {
                return isCollisionAARectToAARect(hitbox1 as G2D.AARect, move1, hitbox2 as G2D.AARect, move2);
            }
        }
        return false;
    } // isCollision

    export function pointInHitbox(point: G2D.Point, hitbox: Hitbox): boolean {
        if (G2D.isCircle(hitbox)) {
            return G2D.pointInCircle(point, hitbox as G2D.Circle);
        }
        if (G2D.isAABox(hitbox)) {
            return G2D.pointInAABox(point, hitbox as G2D.AABox);
        }
        else if (G2D.isAARect(hitbox)) {
            return G2D.pointInAARect(point, hitbox as G2D.AARect);
        }
        return false;
    }
} // Motion2D
