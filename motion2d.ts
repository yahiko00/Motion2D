// motion2d.ts
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

/// <reference path="../paon/dist/paon.d.ts" />
/// <reference path="../geometry2d/dist/geometry2d.d.ts" />

namespace Motion2D {
    export type Path = G2D.Point[];

    export class Mobile {
        // Mobile
        x: number;
        y: number;
        velocity: G2D.Vector;
        maxSpeed: number; // in unit distance per tick
        hitbox: HitboxCircle;
        direction: number;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: HitboxCircle) {
            this.x = x;
            this.y = y;
            this.velocity = { x: 0, y: 0 };
            this.maxSpeed = maxSpeed;
            this.hitbox = hitbox;
            this.direction = direction;
        }

        setMaxSpeed(maxSpeed: number): number {
            this.maxSpeed = maxSpeed;
            return this.maxSpeed;
        }

        setDirection(angleRad: number): number {
            return this.direction = angleRad;
        }

        setVelocity(velocity: G2D.Vector): G2D.Vector {
            this.velocity = G2D.limitVector(velocity, this.maxSpeed);
            if (G2D.lengthSqVector(this.velocity) > G2D.EPSILON) {
                this.direction = G2D.unitVectorToAngle(G2D.normalizeVector(this.velocity));
            }
            return this.velocity;
        }

        updatePosition() {
            // Mobile
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.hitbox.x = this.x;
            this.hitbox.y = this.y;
        }

        moveXY(unitVector: G2D.Vector, speed = this.maxSpeed): void {
            this.setVelocity(G2D.multVectorByScalar(unitVector, Math.min(speed, this.maxSpeed)));
        }

        moveToDirection(speed = this.maxSpeed): void {
            let vector = G2D.angleToUnitVector(this.direction);
            this.moveXY(vector, speed);
        }

        moveToPoint(point: G2D.Point, speed = this.maxSpeed): void {
            this.moveXY(G2D.normalizeVector(G2D.subVectors(point, this)), speed);
        }

        stop(): void {
            this.setVelocity(G2D.NULL_VEC);
        }

        setDirectionToPoint(point: G2D.Point): void {
            let vector = { x: point.x - this.x, y: point.y - this.y };
            this.direction = G2D.unitVectorToAngle(G2D.normalizeVector(vector));
        }

        getSpeed(): number {
            return G2D.lengthVector(this.velocity);
        }

        getDistanceToPoint(point: G2D.Point): number {
            return G2D.distance(this, point);
        }

        getDistanceSqToPoint(point: G2D.Point): number {
            return G2D.distanceSq(this, point);
        }
    } // Mobile

    export class SteeringMobile extends Mobile {
        mass: number;
        acceleration: G2D.Vector;
        path: Path | null;
        currentPathNode: number;
        pathDirection: number;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: HitboxCircle, mass = 1, path?: Path | null, currentPathNode = 0) {
            super(x, y, maxSpeed, direction, hitbox);

            this.mass = mass;
            this.acceleration = G2D.NULL_VEC;
            this.path = path || null;
            this.currentPathNode = currentPathNode;
            this.pathDirection = 1;
        } // constructor

        updatePosition(): void {
            this.acceleration = G2D.NULL_VEC;

            super.updatePosition();
        }

        updateVelocity(): void {
            this.acceleration = G2D.limitVector(this.acceleration, this.maxSpeed);
            this.acceleration = G2D.divVectorByScalar(this.acceleration, this.mass);
            this.setVelocity(G2D.addVectors(this.velocity, this.acceleration));
        }

        flee(point: G2D.Point): void {
            let prefVelocity = G2D.limitVector(G2D.subVectors(this, point), this.maxSpeed);
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seek(point: G2D.Point): void {
            let prefVelocity = G2D.limitVector(G2D.subVectors(point, this), this.maxSpeed);
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seekIntoTolerance(point: G2D.Point, tolerance: number): boolean {
            let distanceSq = this.getDistanceSqToPoint(point) | 0;
            if (distanceSq - tolerance * tolerance <= 0) { // Into tolerance range
                return true;
            }
            else {
                this.seek(point);
                return false;
            }
        }

        /*
         * slowingRadius <= range
         */
        seekArrival(point: G2D.Point, slowingRadius: number, tolerance = 0): boolean {
            let prefVelocity = G2D.limitVector(G2D.subVectors(point, this), this.maxSpeed);
            let distance = this.getDistanceToPoint(point);

            if (distance <= slowingRadius) { // Inside the slowing radius
                prefVelocity = G2D.multVectorByScalar(prefVelocity, this.maxSpeed * distance / slowingRadius);
            }

            if (distance <= tolerance) { // Into tolerance range
                return true;
            }
            else {
                this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
                return false;
            }
        }

        seekRandomPoint(maxX: number, maxY: number, speed = this.maxSpeed): void {
            let point = { x: Math.random() * maxX, y: Math.random() * maxY };
            this.seek(point);
        }

        pursuit(target: Mobile, tickAhead = 3): void {
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seek(futurePosition);
        }

        adaptativePursuit(target: Mobile): void {
            let tickAhead = this.getDistanceToPoint(target) / target.maxSpeed;
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seek(futurePosition);
        }

        evade(target: Mobile, tickAhead = 3): void {
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.flee(futurePosition);
        }

        adaptativeEvade(target: Mobile): void {
            let tickAhead = this.getDistanceToPoint(target) / target.maxSpeed;
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.flee(futurePosition);
        }

        avoidObstacles(obstacles: HitboxCircle[]): any {
            let avoidance = G2D.NULL_VEC;
            let aheadDistance = this.hitbox.radius + 20 * G2D.lengthVector(this.velocity);
            let ahead: G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance));
            let ahead2: G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance / 2));
            let ahead3: G2D.Point = this;

            let mostThreateningObstacle = this.findMostThreateningObstacle(ahead, ahead2, ahead3, obstacles);
            if (mostThreateningObstacle) {
                avoidance = G2D.scaleVector(G2D.subVectors(ahead, mostThreateningObstacle), this.maxSpeed);
            }

            this.acceleration = G2D.addVectors(this.acceleration, avoidance);
            return {
                ahead: ahead,
                ahead2: ahead2,
                ahead3: ahead3,
                mostThreateningObstacle: mostThreateningObstacle
            };
        }

        private findMostThreateningObstacle(ahead: G2D.Point, ahead2: G2D.Point, ahead3: G2D.Point, obstacles: HitboxCircle[]): HitboxCircle | null {
            let mostThreateningObstacle: HitboxCircle | null = null;

            for (let i = 0; i < obstacles.length; i++) {
                let obstacle = obstacles[i];
                if (obstacle !== this.hitbox) {
                    let isCollision = G2D.pointInCircle(ahead, obstacle) || G2D.pointInCircle(ahead2, obstacle) || G2D.pointInCircle(ahead3, obstacle);

                    if (isCollision) {
                        if (!mostThreateningObstacle || G2D.distance(this, obstacle) < G2D.distance(this, mostThreateningObstacle)) {
                            mostThreateningObstacle = obstacle;
                        }
                    }
                }
            } // for i

            return mostThreateningObstacle;
        } // findMostThreateningObstacle

        followPath(tolerance: number, backAndForth = false): boolean {
            if (this.path && this.path.length > 0) {
                let target = this.path[this.currentPathNode];
                this.seek(target);

                if (G2D.distanceSq(this, target) <= tolerance * tolerance) {
                    this.currentPathNode += this.pathDirection;

                    if (this.currentPathNode >= this.path.length || this.currentPathNode < 0) {
                        if (backAndForth) {
                            this.pathDirection *= -1;
                            this.currentPathNode += this.pathDirection;
                        }
                        else {
                            this.currentPathNode = this.path.length - 1;
                            return true;
                        }
                    }
                }
            }

            return false;
        } // followPath

        moveAround(point: G2D.Point, distance: number, clockwise = true): void {
            let direction: number = -1;
            if (!clockwise) {
                direction = 1;
            }
            let toPointVector = G2D.subVectors(this, point);
            let contact = G2D.scaleVector(toPointVector, distance);
            let attraction = G2D.subVectors(contact, toPointVector);
            let tangent = G2D.scaleVector(G2D.tangentVectorCircle({ x: point.x, y: point.y, radius: distance }, this), direction * this.maxSpeed);

            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(attraction, this.velocity));
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(tangent, this.velocity));
        } // moveAround

        moveFront(target: Mobile, distance: number): boolean {
            let targetDirectionVector = G2D.angleToUnitVector(target.direction);
            let toTargetVector = G2D.subVectors(target, this);
            let determinant = G2D.detVectors(targetDirectionVector, toTargetVector);
            if (Math.abs(determinant) < 2) {
                let a1 = target.direction;
                let a2 = G2D.unitVectorToAngle(G2D.normalizeVector(toTargetVector));
                if (Math.abs(a1 - a2) - Math.PI < 0.01) { // less than 6°
                    return true;
                }
            }
            let clockwise = determinant > 0; // On the left
            this.moveAround(target, distance, clockwise);
            return false;
        } // moveFront

        moveBehind(target: Mobile, distance: number): boolean {
            let targetDirectionVector = G2D.angleToUnitVector(target.direction);
            let toTargetVector = G2D.subVectors(target, this);
            let determinant = G2D.detVectors(targetDirectionVector, toTargetVector);
            if (Math.abs(determinant) < 2) {
                let a1 = target.direction;
                let a2 = G2D.unitVectorToAngle(G2D.normalizeVector(toTargetVector));
                if (Math.abs(a1 - a2) < 0.01) { // less than 6°
                    return true;
                }
            }
            let clockwise = determinant <= 0; // On the right
            this.moveAround(target, distance, clockwise);
            return false;
        } // moveBehind
    } // SteeringMobile
} // Motion2D
